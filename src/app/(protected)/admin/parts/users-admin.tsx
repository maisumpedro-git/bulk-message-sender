"use client";
import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/toaster';

interface User { id: string; email: string; role: string; createdAt: string; }

export default function UsersAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [q, setQ] = useState('');
  const { push } = useToast();
  async function load(p=page, search=q) {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), pageSize: '10' });
    if (search) params.set('q', search);
    const res = await fetch('/api/users?' + params.toString());
    const data = await res.json();
    setUsers(data.items);
    setPages(data.pages);
    setPage(data.page);
    setLoading(false);
  }
  useEffect(() => { load(1, q); }, [q]);
  async function toggleRole(u: User) {
    const newRole = u.role === 'ADMIN' ? 'USER' : 'ADMIN';
    const res = await fetch(`/api/users/${u.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: newRole }) });
    if (res.ok) { push({ message: 'Role atualizada', type: 'success' }); load(page); } else push({ message: 'Erro ao atualizar', type: 'error' });
  }
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3 text-xs">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium uppercase text-fg-muted">Buscar</label>
          <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Email" className="rounded-md border border-border/70 bg-surface-alt px-2 py-1 text-xs focus-visible:border-brand focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand/40" />
        </div>
      </div>
      <table className="w-full table-fixed text-left text-[11px]">
        <thead><tr className="text-fg-muted"><th className="w-72">Email</th><th className="w-24">Role</th><th>Ações</th></tr></thead>
        <tbody>
          {users.map(u=> (
            <tr key={u.id} className="border-t border-border/60">
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>
                <button onClick={()=>toggleRole(u)} className="rounded-md border border-border/70 bg-surface-alt px-2 py-0.5 text-[10px] text-fg-muted hover:bg-surface-alt/70">Alternar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center justify-end gap-2 pt-2 text-[11px]">
        <button disabled={page<=1} onClick={()=>load(page-1)} className="rounded-md border border-border/70 bg-surface-alt px-2 py-1 disabled:opacity-40">Prev</button>
        <span>{page} / {pages}</span>
        <button disabled={page>=pages} onClick={()=>load(page+1)} className="rounded-md border border-border/70 bg-surface-alt px-2 py-1 disabled:opacity-40">Next</button>
      </div>
    </div>
  );
}
