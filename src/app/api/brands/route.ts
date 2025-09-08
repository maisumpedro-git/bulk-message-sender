import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '../auth/[...nextauth]/options';
import { z } from 'zod';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const page = Number(url.searchParams.get('page') || '1');
  const pageSize = Math.min(Number(url.searchParams.get('pageSize') || '10'), 50);
  const q = url.searchParams.get('q')?.trim();
  const where = q
    ? { OR: [{ name: { contains: q, mode: 'insensitive' as const } }, { prefix: { contains: q, mode: 'insensitive' as const } }] }
    : undefined;
  const [items, total] = await Promise.all([
  prisma.brand.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
  prisma.brand.count({ where }),
  ]);
  return NextResponse.json({ items, page, pageSize, total, pages: Math.ceil(total / pageSize) });
}

const brandSchema = z.object({ name: z.string().min(1), prefix: z.string().min(1), fromNumber: z.string().min(3) });

export async function POST(req: NextRequest) {
  const session: any = await getServerSession(authOptions as any);
  if (session?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  const parsed = brandSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
  const brand = await prisma.brand.create({ data: parsed.data });
  return NextResponse.json(brand, { status: 201 });
}


