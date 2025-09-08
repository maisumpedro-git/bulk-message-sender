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
          <label className="text-[10px] font-medium uppercase text-neutral-500">Buscar</label>
          <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Email" className="rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-600 dark:bg-neutral-800" />
        </div>
      </div>
      <table className="w-full table-fixed text-left text-[11px]">
        <thead><tr className="text-neutral-500"><th className="w-72">Email</th><th className="w-24">Role</th><th>Ações</th></tr></thead>
        <tbody>
          {users.map(u=> (
            <tr key={u.id} className="border-t border-neutral-200 dark:border-neutral-800">
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>
                <button onClick={()=>toggleRole(u)} className="rounded border border-neutral-300 px-2 py-0.5 text-[10px] hover:bg-neutral-100 dark:border-neutral-600 dark:hover:bg-neutral-800">Alternar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center justify-end gap-2 pt-2 text-[11px]">
        <button disabled={page<=1} onClick={()=>load(page-1)} className="rounded border border-neutral-300 px-2 py-1 disabled:opacity-40 dark:border-neutral-600">Prev</button>
        <span>{page} / {pages}</span>
        <button disabled={page>=pages} onClick={()=>load(page+1)} className="rounded border border-neutral-300 px-2 py-1 disabled:opacity-40 dark:border-neutral-600">Next</button>
      </div>
    </div>
  );
}
