import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '../../auth/[...nextauth]/options';
import { z } from 'zod';

const bodySchema = z.object({ role: z.enum(['ADMIN','USER']) });

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session: any = await getServerSession(authOptions as any);
  if (session?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
  const user = await prisma.user.update({ where: { id: params.id }, data: { role: parsed.data.role } });
  return NextResponse.json({ id: user.id, role: user.role });
}
