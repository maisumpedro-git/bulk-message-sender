import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '../auth/[...nextauth]/options';
import { z } from 'zod';
import { error } from 'console';

const sessionSchema = z.object({
  name: z.string().min(1),
  brandId: z.string().cuid(),
  templateId: z.string().cuid(),
});

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const stats = url.searchParams.get('stats');
  const sessionAuth: any = await getServerSession(authOptions as any);
  const page = Number(url.searchParams.get('page') || '1');
  const pageSize = Math.min(Number(url.searchParams.get('pageSize') || '10'), 50);
  const q = url.searchParams.get('q')?.trim();
  const whereBase = sessionAuth?.role === 'ADMIN' ? undefined : { creatorId: sessionAuth?.user?.id || '' };
  const where = q
    ? {
        AND: [
          whereBase || {},
          { name: { contains: q, mode: 'insensitive' as const } },
        ],
      }
    : whereBase;
  const [sessions, total] = await Promise.all([
  prisma.session.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
  prisma.session.count({ where }),
  ]);
  if (stats !== '1' || !sessions.length)
    return NextResponse.json({ items: sessions, page, pageSize, total, pages: Math.ceil(total / pageSize) });
  const ids = sessions.map((s) => s.id);
  const grouped = await prisma.outboundMessage.groupBy({
    by: ['sessionId', 'status'],
    where: { sessionId: { in: ids } },
    _count: { _all: true },
  });
  const counts: Record<string, { sent: number; failed: number; pending: number; total: number }> =
    {};
  for (const g of grouped) {
    const c =
      counts[g.sessionId] || (counts[g.sessionId] = { sent: 0, failed: 0, pending: 0, total: 0 });
    const n = (g as any)._count._all as number;
    if (g.status === 'SENT') c.sent += n;
    else if (g.status === 'FAILED') c.failed += n;
    else if (g.status === 'PENDING') c.pending += n;
    c.total += n;
  }
  const enriched = sessions.map((s) => ({
    ...s,
    ...(counts[s.id] || { sent: 0, failed: 0, pending: 0, total: 0 }),
  }));
  return NextResponse.json({ items: enriched, page, pageSize, total, pages: Math.ceil(total / pageSize) });
}

export async function POST(req: NextRequest) {
  const sessionAuth: any = await getServerSession(authOptions as any);
  console.log(sessionAuth)
  if (!['ADMIN','USER'].includes(sessionAuth?.role))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const parsed = sessionSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });

  const user = await prisma.user.findFirst({where: {
    email: sessionAuth.user.email
  }})

  if (!user)
    return NextResponse.json({ error: 'User not found' }, { status: 500 });

  const created = await prisma.session.create({
    data: { ...parsed.data, creatorId: user?.id },
  });
  
  return NextResponse.json(created, { status: 201 });
}
