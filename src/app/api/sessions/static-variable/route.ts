import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const bodySchema = z.object({
  sessionId: z.string().cuid(),
  variable: z.string().regex(/^\d+$/), // numeric placeholder like "1"
  value: z.string().min(1), // literal value (e.g. filename or url segment)
});

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const parsed = bodySchema.safeParse(data);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 });
    }
    const { sessionId, variable, value } = parsed.data;
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 });
    // Upsert to allow replacing
    // @ts-ignore delegate naming
    const existing = await (prisma as any).sessionStaticVariable.findFirst({ where: { sessionId, variable } });
    let record;
    if (existing) {
      // @ts-ignore delegate naming
      record = await (prisma as any).sessionStaticVariable.update({ where: { id: existing.id }, data: { value } });
    } else {
      // @ts-ignore delegate naming
      record = await (prisma as any).sessionStaticVariable.create({ data: { sessionId, variable, value } });
    }
    return NextResponse.json(record, { status: 200 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: 'Erro interno', message: e.message }, { status: 500 });
  }
}
