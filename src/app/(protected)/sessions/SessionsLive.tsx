'use client';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import StartButton from './StartButton';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

type SessionWithCounts = {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  sent?: number;
  failed?: number;
  pending?: number;
  total?: number;
};

export default function SessionsLive() {
  const [sessions, setSessions] = useState<SessionWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/sessions?stats=1', { cache: 'no-store' });
      const data = await res.json();
      setSessions(data);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, [load]);

  const filtered = useMemo(
    () =>
      sessions.filter(
        (s) =>
          (!statusFilter || s.status === statusFilter) &&
          (!search || s.name.toLowerCase().includes(search.toLowerCase())),
      ),
    [sessions, statusFilter, search],
  );
  const summary = useMemo(() => {
    return filtered.reduce(
      (acc, s) => {
        acc.total += s.total || 0;
        acc.sent += s.sent || 0;
        acc.failed += s.failed || 0;
        acc.pending += s.pending || 0;
        return acc;
      },
      { total: 0, sent: 0, failed: 0, pending: 0 },
    );
  }, [filtered]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
            Buscar
          </label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nome"
            className="h-9 w-48 rounded border border-neutral-300 bg-white px-2 text-sm shadow-sm focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-400"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded border border-neutral-300 bg-white px-2 text-sm shadow-sm focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-400"
          >
            <option value="">Todos</option>
            <option value="DRAFT">Draft</option>
            <option value="RUNNING">Running</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
        <div className="ml-auto flex gap-4 rounded-md border border-neutral-200 bg-white px-4 py-3 text-xs font-medium shadow-sm">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-neutral-500">Total</span>
            <span>{summary.total}</span>
          </div>
          <div className="flex flex-col text-emerald-700">
            <span className="text-[10px] uppercase text-neutral-500">Enviados</span>
            <span>{summary.sent}</span>
          </div>
          <div className="flex flex-col text-rose-700">
            <span className="text-[10px] uppercase text-neutral-500">Falhados</span>
            <span>{summary.failed}</span>
          </div>
          <div className="flex flex-col text-amber-700">
            <span className="text-[10px] uppercase text-neutral-500">Pendentes</span>
            <span>{summary.pending}</span>
          </div>
        </div>
      </div>
      {loading && !sessions.length && <p className="text-sm text-neutral-600">Carregando...</p>}
      {filtered.map((s) => {
        const total = s.total || 0;
        const sent = s.sent || 0;
        const failed = s.failed || 0;
        const pending = s.pending || 0;
        const progress = total ? ((sent + failed) / total) * 100 : 0;
        const tone =
          s.status === 'RUNNING'
            ? 'warning'
            : s.status === 'COMPLETED'
              ? 'success'
              : s.status === 'FAILED'
                ? 'danger'
                : 'neutral';
        return (
          <div key={s.id} className="rounded-md border border-neutral-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Link
                  href={`/sessions/${s.id}`}
                  className="font-semibold text-neutral-900 hover:underline"
                >
                  {s.name}
                </Link>
                <p className="mt-0.5 text-[11px] uppercase tracking-wide text-neutral-500">
                  {new Date(s.createdAt as any).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={tone}>{s.status}</Badge>
                {s.status === 'DRAFT' && <StartButton sessionId={s.id} />}
              </div>
            </div>
            {(s.status === 'RUNNING' || s.status === 'COMPLETED' || s.status === 'FAILED') &&
              total > 0 && (
                <div className="mt-3">
                  <div className="h-2 w-full overflow-hidden rounded bg-neutral-100">
                    <div
                      className="h-full bg-neutral-800 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-neutral-600">
                    Enviados: {sent} | Falhados: {failed} | Pendentes: {pending} | Total: {total}
                  </p>
                </div>
              )}
          </div>
        );
      })}
      {!loading && !filtered.length && <p className="text-sm text-neutral-600">Nenhuma sessão.</p>}
    </div>
  );
}
