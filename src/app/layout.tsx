import './globals.css';
import { ReactNode } from 'react';
import { ThemeRegistry } from './ThemeRegistry';

export const metadata = {
  title: 'Bulk Message Sender',
  description: 'Manage bulk messaging sessions'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
