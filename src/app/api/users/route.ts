import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '../auth/[...nextauth]/options';

export async function GET(req: NextRequest) {
  const session: any = await getServerSession(authOptions as any);
  if (session?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const url = new URL(req.url);
  const page = Number(url.searchParams.get('page') || '1');
  const pageSize = Math.min(Number(url.searchParams.get('pageSize') || '10'), 50);
  const q = url.searchParams.get('q')?.trim();
  const where = q ? { email: { contains: q, mode: 'insensitive' as const } } : undefined;
  const [items, total] = await Promise.all([
  prisma.user.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize, select: { id: true, email: true, role: true, createdAt: true } }),
  prisma.user.count({ where }),
  ]);
  return NextResponse.json({ items, page, pageSize, total, pages: Math.ceil(total / pageSize) });
}

