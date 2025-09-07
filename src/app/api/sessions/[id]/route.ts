import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const session = await prisma.session.findUnique({ where: { id }, include: { brand: true, template: true } });
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const grouped = await prisma.outboundMessage.groupBy({
    by: ['status'],
    where: { sessionId: id },
    _count: { _all: true }
  });
  const counts = { sent: 0, failed: 0, pending: 0, total: 0 };
  for (const g of grouped) {
    const n = (g as any)._count._all as number;
    if (g.status === 'SENT') counts.sent += n;
    else if (g.status === 'FAILED') counts.failed += n;
    else if (g.status === 'PENDING') counts.pending += n;
    counts.total += n;
  }
  return NextResponse.json({ session, counts });
}
