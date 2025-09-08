import Link from 'next/link';
import SessionsLive from './SessionsLive';
import { Button } from '@/components/ui/button';

export default function SessionsPage() {
  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-fg">Sessões</h1>
        <Link
          href="/sessions/new"
          className="inline-flex h-9 items-center justify-center rounded-md bg-brand px-4 text-sm font-medium text-white shadow-subtle hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          Criar Sessão
        </Link>
      </div>
      <SessionsLive />
    </div>
  );
}
