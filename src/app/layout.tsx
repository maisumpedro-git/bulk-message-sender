import './globals.css';
import { ReactNode } from 'react';
import { NavBar } from '@/components/nav-bar';
import { ToastProvider } from '@/components/ui/toaster';

export const metadata = {
  title: 'Bulk Message Sender',
  description: 'Manage bulk messaging sessions',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen bg-bg text-fg antialiased selection:bg-brand/20 selection:text-fg cq">
        <ToastProvider>
          <NavBar />
          <main className="container pb-12 pt-2 sm:pt-4">
            {children}
          </main>
        </ToastProvider>
      </body>
    </html>
  );
}
