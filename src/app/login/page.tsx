'use client';
import { signIn } from 'next-auth/react';
import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await signIn('credentials', { redirect: false, email, password });
    if (res?.error) setError('Credenciais inválidas');
    else window.location.href = '/';
    setLoading(false);
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-md border border-border/60 bg-surface p-6 shadow-subtle backdrop-blur supports-[backdrop-filter]:bg-surface/90">
        <h1 className="mb-4 text-center text-xl font-semibold tracking-tight text-fg">Login</h1>
        {error && (
          <div className="mb-4 rounded-md border border-danger/40 bg-danger/15 px-3 py-2 text-sm text-danger">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-fg">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-md border border-border/70 bg-surface-alt px-3 py-2 text-sm text-fg placeholder-fg-muted/70 shadow-sm focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-fg">Senha</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="rounded-md border border-border/70 bg-surface-alt px-3 py-2 text-sm text-fg placeholder-fg-muted/70 shadow-sm focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            />
          </label>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </div>
    </div>
  );
}
