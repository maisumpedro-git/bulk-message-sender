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
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const load = useCallback(async (p = page, searchQ = search) => {
    try {
      const params = new URLSearchParams({ stats: '1', page: String(p), pageSize: '10' });
      if (searchQ) params.set('q', searchQ);
      const res = await fetch('/api/sessions?' + params.toString(), { cache: 'no-store' });
      const data = await res.json();
      setSessions(data.items);
      setPages(data.pages);
      setPage(data.page);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(1, search);
    const id = setInterval(() => load(page, search), 4000);
    return () => clearInterval(id);
  }, [load, page, search]);

  const filtered = useMemo(
    () =>
      sessions.filter(
        (s) => !statusFilter || s.status === statusFilter,
      ),
    [sessions, statusFilter],
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
          <label className="text-[11px] font-medium uppercase tracking-wide text-fg-muted">
            Buscar
          </label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nome"
            className="h-9 w-48 rounded-md border border-border/70 bg-surface-alt px-2 text-sm shadow-sm focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium uppercase tracking-wide text-fg-muted">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border border-border/70 bg-surface-alt px-2 text-sm shadow-sm focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <option value="">Todos</option>
            <option value="DRAFT">Draft</option>
            <option value="RUNNING">Running</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
  <div className="ml-auto flex gap-4 rounded-md border border-border/60 bg-surface px-4 py-3 text-xs font-medium shadow-subtle">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-fg-muted">Total</span>
            <span>{summary.total}</span>
          </div>
          <div className="flex flex-col text-success">
            <span className="text-[10px] uppercase text-fg-muted">Enviados</span>
            <span>{summary.sent}</span>
          </div>
          <div className="flex flex-col text-danger">
            <span className="text-[10px] uppercase text-fg-muted">Falhados</span>
            <span>{summary.failed}</span>
          </div>
          <div className="flex flex-col text-warning">
            <span className="text-[10px] uppercase text-fg-muted">Pendentes</span>
            <span>{summary.pending}</span>
          </div>
        </div>
      </div>
      {loading && !sessions.length && <p className="text-sm text-fg-muted">Carregando...</p>}
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
          <div key={s.id} className="rounded-md border border-border/60 bg-surface p-3 shadow-subtle">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Link
                  href={`/sessions/${s.id}`}
                  className="font-semibold text-fg hover:underline"
                >
                  {s.name}
                </Link>
                <p className="mt-0.5 text-[11px] uppercase tracking-wide text-fg-muted">
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
                  <div className="h-2 w-full overflow-hidden rounded bg-fg-muted/15">
                    <div
                      className="h-full bg-brand transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-fg-muted">
                    Enviados: {sent} | Falhados: {failed} | Pendentes: {pending} | Total: {total}
                  </p>
                </div>
              )}
          </div>
        );
      })}
      {!loading && !filtered.length && <p className="text-sm text-fg-muted">Nenhuma sessão.</p>}
      <div className="flex items-center justify-end gap-2 pt-2 text-[11px]">
        <button disabled={page<=1} onClick={()=>{setPage(p=>p-1); load(page-1, search);}} className="rounded-md border border-border/70 bg-surface-alt px-2 py-1 text-fg-muted hover:bg-surface-alt/80 disabled:opacity-40">Prev</button>
        <span>{page} / {pages}</span>
        <button disabled={page>=pages} onClick={()=>{setPage(p=>p+1); load(page+1, search);}} className="rounded-md border border-border/70 bg-surface-alt px-2 py-1 text-fg-muted hover:bg-surface-alt/80 disabled:opacity-40">Next</button>
      </div>
    </div>
  );
}
