import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enqueueSession } from '@/lib/messageQueue';

export async function POST(req: NextRequest) {
  const { sessionId } = await req.json();
  if (!sessionId) return NextResponse.json({ error: 'sessionId requerido' }, { status: 400 });
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session) return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 });
  if (session.status !== 'DRAFT') return NextResponse.json({ error: 'Sessão não está em DRAFT' }, { status: 400 });
  await prisma.session.update({ where: { id: sessionId }, data: { status: 'RUNNING' } });
  enqueueSession(sessionId).catch(err => console.error('enqueue error', err));
  return NextResponse.json({ success: true });
}
