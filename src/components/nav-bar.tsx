import Link from 'next/link';
import { headers } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import LogoutButton from './user/logout-button';

interface NavLink {
  href: string;
  label: string;
  match?: RegExp;
}

const links: NavLink[] = [
  { href: '/sessions', label: 'Sessões', match: /^\/sessions/ },
  { href: '/sessions/new', label: 'Nova', match: /^\/sessions\/new/ },
];

export async function NavBar() {
  const h = headers();
  const path = h.get('x-invoke-path') || h.get('next-url') || '/';
  const session: any = await getServerSession(authOptions as any);
  const role = session?.role as string | undefined;
  const allLinks = role === 'ADMIN' ? [...links, { href: '/admin', label: 'Admin', match: /^\/admin/ }] : links;
  const initials = (session?.user?.name || session?.user?.email || '?')
    .split(/\s+/)
  .map((p: string) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <header className="sticky top-0 z-40 mb-8 w-full border-b border-neutral-200 backdrop-blur bg-white/70 supports-[backdrop-filter]:bg-white/55 dark:bg-neutral-900/70 dark:border-neutral-800">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/sessions" className="text-sm font-semibold tracking-tight">
          Bulk Sender
        </Link>
        <nav className="flex items-center gap-4 text-xs font-medium">
          {allLinks.map((l) => {
            const active = l.match?.test(path) || path === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={
                  active
                    ? 'text-neutral-900 dark:text-neutral-100'
                    : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
                }
              >
                {l.label}
              </Link>
            );
          })}
          {session?.user && (
            <div className="flex items-center gap-3 pl-4 border-l border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 text-[10px] font-semibold tracking-wide text-neutral-700 dark:bg-neutral-700 dark:text-neutral-100">
                  {initials}
                </div>
                <span className="hidden sm:inline text-neutral-600 dark:text-neutral-300 text-[11px] max-w-[140px] truncate">
                  {session.user?.email}
                </span>
              </div>
              <LogoutButton />
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
