import './globals.css';
import { ReactNode } from 'react';
import { NavBar } from '@/components/nav-bar';

export const metadata = {
  title: 'Bulk Message Sender',
  description: 'Manage bulk messaging sessions',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gradient-to-br from-neutral-50 via-neutral-100 to-neutral-200 text-neutral-900 antialiased [background:radial-gradient(circle_at_25%_15%,rgba(0,0,0,0.04),transparent_60%),radial-gradient(circle_at_75%_85%,rgba(0,0,0,0.05),transparent_55%)]">
        <NavBar />
        <div className="mx-auto max-w-6xl px-4 pb-10">{children}</div>
      </body>
    </html>
  );
}
