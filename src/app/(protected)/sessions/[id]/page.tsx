import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

async function getSession(id: string) {
  const session = await prisma.session.findUnique({
    where: { id },
    include: { brand: true, template: true },
  });
  if (!session) return null;
  const grouped = await prisma.outboundMessage.groupBy({
    by: ['status'],
    where: { sessionId: id },
    _count: { _all: true },
  });
  const counts = { sent: 0, failed: 0, pending: 0, total: 0 };
  for (const g of grouped) {
    const n = (g as any)._count._all as number;
    if (g.status === 'SENT') counts.sent += n;
    else if (g.status === 'FAILED') counts.failed += n;
    else if (g.status === 'PENDING') counts.pending += n;
    counts.total += n;
  }
  return { session, counts };
}

export default async function SessionDetail({ params }: { params: { id: string } }) {
  const data = await getSession(params.id);
  if (!data) return <div className="p-6 text-sm">Sessão não encontrada</div>;
  const { session, counts } = data;
  const tone =
    session.status === 'RUNNING'
      ? 'warning'
      : session.status === 'COMPLETED'
        ? 'success'
        : session.status === 'FAILED'
          ? 'danger'
          : 'neutral';
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-fg">Sessão: {session.name}</h1>
        <Badge tone={tone}>{session.status}</Badge>
      </div>
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <InfoCard label="Criada" value={new Date(session.createdAt as any).toLocaleString()} />
        <InfoCard label="Marca" value={session.brand.name} />
        <InfoCard label="Template" value={session.template.name} />
        <InfoCard label="Status" value={session.status} />
      </div>
      <div className="rounded-md border border-border/60 bg-surface p-4 shadow-subtle">
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-fg-muted">Estatísticas</h2>
        <div className="flex flex-wrap gap-6">
          <Stat label="Total" value={counts.total} />
          <Stat label="Enviados" value={counts.sent} />
          <Stat label="Falhados" value={counts.failed} />
          <Stat label="Pendentes" value={counts.pending} />
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <ProgressCard counts={counts} />
          <Distribution counts={counts} />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={`/api/sessions/${session.id}/export`}
            className="inline-flex h-9 items-center rounded-md bg-brand px-4 text-sm font-medium text-white shadow-subtle hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            Exportar CSV
          </a>
          <Link
            href="/sessions"
            className="inline-flex h-9 items-center rounded-md border border-border/70 bg-surface-alt px-4 text-sm font-medium text-fg hover:bg-surface-alt/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            Voltar
          </Link>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
  <span className="block text-[11px] uppercase tracking-wide text-fg-muted">{label}</span>
  <span className="text-sm font-semibold text-fg">{value}</span>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-border/60 bg-surface p-3 shadow-subtle">
      <p className="text-[11px] font-medium uppercase tracking-wide text-fg-muted">{label}</p>
      <p className="truncate text-sm font-semibold text-fg" title={String(value)}>
        {value}
      </p>
    </div>
  );
}

function ProgressCard({
  counts,
}: {
  counts: { total: number; sent: number; failed: number; pending: number };
}) {
  const { total, sent, failed, pending } = counts;
  const completedPct = total ? ((sent + failed) / total) * 100 : 0;
  return (
    <div className="rounded-md border border-border/60 bg-surface p-4 shadow-subtle">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-muted">
        Progresso Geral
      </h3>
      <div className="h-3 w-full overflow-hidden rounded bg-fg-muted/15">
        <div className="h-full bg-brand" style={{ width: `${completedPct}%` }} />
      </div>
      <p className="mt-2 text-[11px] text-fg-muted">{completedPct.toFixed(1)}% concluído</p>
    </div>
  );
}

function Distribution({
  counts,
}: {
  counts: { total: number; sent: number; failed: number; pending: number };
}) {
  const { total, sent, failed, pending } = counts;
  const segments = [
    { label: 'Enviados', value: sent, color: 'bg-emerald-500' },
    { label: 'Falhados', value: failed, color: 'bg-rose-500' },
    { label: 'Pendentes', value: pending, color: 'bg-amber-500' },
  ];
  return (
    <div className="rounded-md border border-border/60 bg-surface p-4 shadow-subtle">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-muted">
        Distribuição
      </h3>
      <div className="flex h-3 w-full overflow-hidden rounded">
        {segments.map((s) => {
          const pct = total ? (s.value / total) * 100 : 0;
          return (
            <div
              key={s.label}
              className={`${s.color}`}
              style={{ width: `${pct}%` }}
              title={`${s.label} ${s.value}`}
            />
          );
        })}
      </div>
      <ul className="mt-2 space-y-1">
        {segments.map((s) => {
          const pct = total ? (s.value / total) * 100 : 0;
          return (
            <li key={s.label} className="flex items-center justify-between text-[11px] text-fg-muted">
              <span>{s.label}</span>
              <span>
                {s.value} ({pct.toFixed(1)}%)
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
