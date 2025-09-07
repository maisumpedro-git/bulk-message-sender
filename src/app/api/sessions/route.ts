import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const sessionSchema = z.object({
  name: z.string().min(1),
  brandId: z.string().cuid(),
  templateId: z.string().cuid()
});

export async function GET() {
  const sessions = await prisma.session.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
  return NextResponse.json(sessions);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = sessionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
  // TODO: auth user
  const creatorId = 'temp-user';
  const session = await prisma.session.create({ data: { ...parsed.data, creatorId } });
  return NextResponse.json(session, { status: 201 });
}
