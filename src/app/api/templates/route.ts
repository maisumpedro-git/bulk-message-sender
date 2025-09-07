import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { listContentTemplates } from '@/services/twilioContent';

// Placeholder: This would call Twilio Content API with pagination (cursor or page param)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const { items, hasMore } = await listContentTemplates(page);
  return NextResponse.json({ page, items, hasMore });
}

const templateCreateSchema = z.object({
  twilioId: z.string().min(1),
  name: z.string().min(1),
  hasVariables: z.boolean().optional().default(false)
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = templateCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
  const { twilioId, name, hasVariables } = parsed.data;
  const existing = await prisma.templateReference.findUnique({ where: { twilioId } });
  if (existing) return NextResponse.json(existing, { status: 200 });
  const created = await prisma.templateReference.create({ data: { twilioId, name, hasVariables } });
  return NextResponse.json(created, { status: 201 });
}
