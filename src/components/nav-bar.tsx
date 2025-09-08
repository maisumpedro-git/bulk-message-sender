import Link from 'next/link';
import { headers } from 'next/headers';

interface NavLink {
  href: string;
  label: string;
  match?: RegExp;
}

const links: NavLink[] = [
  { href: '/sessions', label: 'Sessões', match: /^\/sessions/ },
  { href: '/sessions/new', label: 'Nova', match: /^\/sessions\/new/ },
];

export function NavBar() {
  const h = headers();
  const path = h.get('x-invoke-path') || h.get('next-url') || '/';
  return (
    <header className="sticky top-0 z-40 mb-8 w-full border-b border-neutral-200 backdrop-blur bg-white/70 supports-[backdrop-filter]:bg-white/55 dark:bg-neutral-900/70 dark:border-neutral-800">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/sessions" className="text-sm font-semibold tracking-tight">
          Bulk Sender
        </Link>
        <nav className="flex items-center gap-4 text-xs font-medium">
          {links.map((l) => {
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
        </nav>
      </div>
    </header>
  );
}
