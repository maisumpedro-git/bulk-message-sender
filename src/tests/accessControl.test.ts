import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as usersRoute from '@/app/api/users/route';
import * as brandsRoute from '@/app/api/brands/route';
import * as brandItemRoute from '@/app/api/brands/[id]/route';

// Mock getServerSession globally
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

// Mock prisma to avoid hitting real DB for role checks (only minimal usage here)
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { count: vi.fn(), findMany: vi.fn() },
    brand: { findMany: vi.fn(), count: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    session: { findMany: vi.fn(), count: vi.fn() },
  },
}));

import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

function buildNextRequest(url: string, method: string = 'GET', body?: any): any {
  const req = new Request(url, { method, body: body ? JSON.stringify(body) : undefined });
  return Object.assign(req, {
    nextUrl: new URL(url),
    cookies: { get: () => undefined },
    geo: undefined,
    ip: undefined,
  });
}

describe('Access Control', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('blocks non-admin listing users', async () => {
    (getServerSession as any).mockResolvedValue({ role: 'USER', user: { id: 'u1' } });
  const res = (await usersRoute.GET(buildNextRequest('http://test/api/users'))) as Response;
    expect(res.status).toBe(403);
  });

  it('allows admin listing users', async () => {
    (getServerSession as any).mockResolvedValue({ role: 'ADMIN', user: { id: 'a1' } });
    (prisma.user.findMany as any).mockResolvedValue([]);
    (prisma.user.count as any).mockResolvedValue(0);
  const res = (await usersRoute.GET(buildNextRequest('http://test/api/users'))) as Response;
    expect(res.status).toBe(200);
  });

  it('blocks creating brand for non-admin', async () => {
    (getServerSession as any).mockResolvedValue({ role: 'USER' });
  const res = (await brandsRoute.POST(buildNextRequest('http://test/api/brands', 'POST', { name: 'X', prefix: 'p', fromNumber: '123' }))) as Response;
    expect(res.status).toBe(403);
  });

  it('allows admin update brand', async () => {
    (getServerSession as any).mockResolvedValue({ role: 'ADMIN' });
    (prisma.brand.update as any).mockResolvedValue({ id: 'b1', name: 'N', prefix: 'p', fromNumber: '123' });
  const res = (await brandItemRoute.PATCH(buildNextRequest('http://test/api/brands/b1', 'PATCH', { name: 'New' }), { params: { id: 'b1' } })) as Response;
    expect(res.status).toBe(200);
  });
});
