import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { parse } from 'csv-parse/sync';

// Expects multipart form-data: sessionId, phoneColumn, variableMappings(json), file(csv)
const mappingsSchema = z.array(
  z.object({ variable: z.string().min(1), columnKey: z.string().min(1) }),
);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const sessionId = formData.get('sessionId');
    const phoneColumn = formData.get('phoneColumn');
    const variableMappingsRaw = formData.get('variableMappings');
    const file = formData.get('file');
    if (!sessionId || typeof sessionId !== 'string')
      return NextResponse.json({ error: 'sessionId obrigatório' }, { status: 400 });
    if (!phoneColumn || typeof phoneColumn !== 'string')
      return NextResponse.json({ error: 'phoneColumn obrigatório' }, { status: 400 });
    if (!file || !(file instanceof File))
      return NextResponse.json({ error: 'Arquivo CSV ausente' }, { status: 400 });

    let variableMappings: Array<{ variable: string; columnKey: string }> = [];
    if (
      variableMappingsRaw &&
      typeof variableMappingsRaw === 'string' &&
      variableMappingsRaw !== '[]'
    ) {
      const parsed = JSON.parse(variableMappingsRaw);
      const validated = mappingsSchema.safeParse(parsed);
      if (!validated.success)
        return NextResponse.json(
          { error: 'Mapeamentos inválidos', details: validated.error.flatten() },
          { status: 400 },
        );
      variableMappings = validated.data;
    }

    const existing = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!existing) return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 });

    const buf = Buffer.from(await file.arrayBuffer());
    const records: Record<string, string>[] = parse(buf, { columns: true, skip_empty_lines: true });
    if (!records.length) return NextResponse.json({ error: 'CSV vazio' }, { status: 400 });
    if (!records[0].hasOwnProperty(phoneColumn))
      return NextResponse.json({ error: 'Coluna de telefone inexistente' }, { status: 400 });

    // Create ContactList + Contacts in transaction for integrity
    const contactListName = file.name.replace(/\.csv$/i, '') || 'Lista';
    const result = await prisma.$transaction(async (tx) => {
      const list = await tx.contactList.create({ data: { name: contactListName, sessionId } });
      const contactsData = records.map((r) => ({
        phone: (r[phoneColumn] || '').trim(),
        rawData: r,
        contactListId: list.id,
      }));
      // Filter minimal valid phone (basic digits check)
      const filtered = contactsData.filter((c) => /\d{6,}/.test(c.phone));
      await tx.contact.createMany({ data: filtered });
      if (variableMappings.length) {
        // @ts-ignore - delegate typing may require prisma generate refresh
        await (tx as any).sessionVariableMapping.createMany({
          data: variableMappings.map((m) => ({
            sessionId,
            variable: m.variable,
            columnKey: m.columnKey,
          })),
        });
      }
      return { listId: list.id, contacts: filtered.length, totalRows: records.length };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: 'Erro interno', message: e.message }, { status: 500 });
  }
}
