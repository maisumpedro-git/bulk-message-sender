import PQueue from 'p-queue';
import { prisma } from '@/lib/prisma';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { sendMessage } from '@/services/twilio';

// Single process in-memory queue (replace with Redis/BullMQ in production)
const queue = new PQueue({ concurrency: 5 });

export async function enqueueSession(sessionId: string) {
  // load contacts
  const contacts = await prisma.contact.findMany({ where: { contactList: { sessionId } }, include: { contactList: true } });
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
    // Placeholder body (template merge not yet implemented)
    const body = 'Mensagem';
    const sid = await sendMessage(phoneNormalized, body, '+000000000');
    await prisma.outboundMessage.update({ where: { id: msg.id }, data: { status: 'SENT', twilioSid: sid } });
  } catch (e: any) {
    await prisma.outboundMessage.update({ where: { id: msg.id }, data: { status: 'FAILED', error: e.message } });
  }
}

export function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/[^0-9+]/g, '');
  let p = parsePhoneNumberFromString(digits, 'BR');
  if (!p || !p.isValid()) return null;
  return p.number; // E.164
}
