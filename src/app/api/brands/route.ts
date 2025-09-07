import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const brands = await prisma.brand.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(brands);
}
