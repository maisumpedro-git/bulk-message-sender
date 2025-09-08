import Link from 'next/link';
import SessionsLive from './SessionsLive';
import { Button } from '@/components/ui/button';

export default function SessionsPage() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Sessões</h1>
        <Link
          href="/sessions/new"
          className="inline-flex h-9 items-center justify-center rounded bg-neutral-900 px-4 text-sm font-medium text-white shadow hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2"
        >
          Criar Sessão
        </Link>
      </div>
      <SessionsLive />
    </div>
  );
}
