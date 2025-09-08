import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const session = await prisma.session.findUnique({ where: { id } });
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const messages = await prisma.outboundMessage.findMany({
    where: { sessionId: id },
    orderBy: { createdAt: 'asc' },
  });
  const header = ['id', 'status', 'twilioSid', 'error', 'createdAt', 'updatedAt'];
  const rows = messages.map((m) => [
    m.id,
    m.status,
    m.twilioSid || '',
    (m as any).error || '',
    m.createdAt.toISOString(),
    m.updatedAt.toISOString(),
  ]);
  const csv = [
    header.join(','),
    ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="session-${id}.csv"`,
    },
  });
}
