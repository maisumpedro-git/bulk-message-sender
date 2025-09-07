import PQueue from 'p-queue';
import { prisma } from '@/lib/prisma';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { getTwilioClient } from '@/services/twilio';

// Helper to track when all jobs of a session finished so we can update status
interface SessionProgressTracker {
  total: number;
  done: number;
  failed: number;
}

const trackers: Record<string, SessionProgressTracker> = {};

// Single process in-memory queue (replace with Redis/BullMQ in production)
const queue = new PQueue({ concurrency: 5 });

export async function enqueueSession(sessionId: string) {
  // load contacts
  const contacts = await prisma.contact.findMany({ where: { contactList: { sessionId } }, include: { contactList: true } });
  trackers[sessionId] = { total: contacts.length, done: 0, failed: 0 };
  if (!contacts.length) {
    // Nothing to send -> mark completed immediately
    await prisma.session.update({ where: { id: sessionId }, data: { status: 'COMPLETED' } });
    return;
  }
  for (const c of contacts) {
    queue.add(() => processContact(sessionId, c.id, c.phone).catch(() => {}));
  }
}

async function processContact(sessionId: string, contactId: string, rawPhone: string) {
  // Basic phone normalization
  const phoneNormalized = normalizePhone(rawPhone);
  if (!phoneNormalized) {
    await prisma.outboundMessage.create({ data: { sessionId, contactId, status: 'FAILED', error: 'Invalid phone' } });
    return;
  }
  const msg = await prisma.outboundMessage.create({ data: { sessionId, contactId, status: 'PENDING' } });
  try {
    // Load session + template + mappings + brand to send proper content message
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session) throw new Error('Sessão não encontrada');
  const templateRef = await prisma.templateReference.findUnique({ where: { id: session.templateId } });
  if (!templateRef) throw new Error('Template não encontrado');
  // @ts-ignore prisma delegate name (model: SessionVariableMapping) becomes sessionVariableMapping
  const mappings = await (prisma as any).sessionVariableMapping.findMany({ where: { sessionId } });
  const brand = await prisma.brand.findUnique({ where: { id: session.brandId } });
  if (!brand) throw new Error('Marca não encontrada');
  const contentSid = templateRef.twilioId; // stored twilio content sid
    // Build content variables object with numeric keys expected by Twilio
    let contentVariables: Record<string, string> = {};
    if (mappings.length) {
      const contact = await prisma.contact.findUnique({ where: { id: contactId } });
      if (contact) {
        for (const m of mappings) {
          const raw = (contact.rawData as any) || {};
            // Only include if variable numeric or treat literal
          const key = m.variable.trim();
          if (raw && raw[m.columnKey] != null && key) {
            contentVariables[key] = String(raw[m.columnKey]);
          }
        }
      }
    }
    const client = getTwilioClient();
  const from = brand.fromNumber; // assume proper whatsapp: prefix stored
    const createParams: any = {
      to: phoneNormalized,
      from,
      contentSid,
    };
    if (Object.keys(contentVariables).length) {
      createParams.contentVariables = JSON.stringify(contentVariables);
    }
    const msgRes = await client.messages.create(createParams);
    const sid = msgRes.sid;
    await prisma.outboundMessage.update({ where: { id: msg.id }, data: { status: 'SENT', twilioSid: sid } });
    incrementTracker(sessionId, false);
  } catch (e: any) {
    await prisma.outboundMessage.update({ where: { id: msg.id }, data: { status: 'FAILED', error: e.message } });
    incrementTracker(sessionId, true);
  }
}

export function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/[^0-9+]/g, '');
  let p = parsePhoneNumberFromString(digits, 'BR');
  if (!p || !p.isValid()) return null;
  return p.number; // E.164
}

async function incrementTracker(sessionId: string, failed: boolean) {
  const tracker = trackers[sessionId];
  if (!tracker) return;
  tracker.done += 1;
  if (failed) tracker.failed += 1;
  if (tracker.done >= tracker.total) {
    // Finalize session status based on failures
    try {
      await prisma.session.update({
        where: { id: sessionId },
        data: { status: tracker.failed > 0 && tracker.failed === tracker.total ? 'FAILED' : 'COMPLETED' }
      });
    } catch (err) {
      console.error('Failed to update session status', sessionId, err);
    } finally {
      delete trackers[sessionId];
    }
  }
}
