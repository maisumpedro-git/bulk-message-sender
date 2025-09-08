import { headers } from 'next/headers';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/api/auth/[...nextauth]/options';
import Link from 'next/link';
import BrandsAdmin from './parts/brands-admin';
import UsersAdmin from './parts/users-admin';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const session: any = await getServerSession(authOptions as any);
  if (session?.role !== 'ADMIN') {
    return (
      <div className="mx-auto max-w-4xl p-6 text-sm text-red-600 dark:text-red-400">
        Acesso negado.
      </div>
    );
  }
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 p-6">
      <h1 className="text-lg font-semibold tracking-tight text-fg">Admin</h1>
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-fg-muted">Marcas</h2>
        <BrandsAdmin />
      </section>
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-fg-muted">Usuários</h2>
        <UsersAdmin />
      </section>
    </div>
  );
}
