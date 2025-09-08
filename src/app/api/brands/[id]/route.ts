import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '../../auth/[...nextauth]/options';
import { z } from 'zod';

const brandSchema = z.object({ name: z.string().min(1), prefix: z.string().min(1), fromNumber: z.string().min(3) });

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session: any = await getServerSession(authOptions as any);
  if (session?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  const parsed = brandSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
  const brand = await prisma.brand.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json(brand);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session: any = await getServerSession(authOptions as any);
  if (session?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  await prisma.brand.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
