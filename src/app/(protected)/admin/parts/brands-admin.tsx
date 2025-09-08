"use client";
import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/toaster';

interface Brand {
  id: string; name: string; prefix: string; fromNumber: string; createdAt: string;
}

export default function BrandsAdmin() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [q, setQ] = useState('');
  const { push } = useToast();
  const [editing, setEditing] = useState<Brand | null>(null);
  const [form, setForm] = useState({ name: '', prefix: '', fromNumber: '' });
  async function load(p = page, search = q) {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), pageSize: '10' });
    if (search) params.set('q', search);
    const res = await fetch('/api/brands?' + params.toString());
    const data = await res.json();
    setBrands(data.items);
    setPages(data.pages);
    setPage(data.page);
    setLoading(false);
  }
  useEffect(() => { load(1, q); }, [q]);
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.prefix || !form.fromNumber) return;
    const res = await fetch('/api/brands', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) { setForm({ name: '', prefix: '', fromNumber: '' }); push({ message: 'Marca criada', type: 'success' }); load(1); } else { push({ message: 'Erro ao criar', type: 'error' }); }
  }
  async function saveEdit() {
    if (!editing) return;
    const res = await fetch('/api/brands/' + editing.id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: editing.name, prefix: editing.prefix, fromNumber: editing.fromNumber }) });
    if (res.ok) { push({ message: 'Marca atualizada', type: 'success' }); setEditing(null); load(page); } else push({ message: 'Erro ao atualizar', type: 'error' });
  }
  async function remove(id: string) {
    if (!confirm('Remover esta marca?')) return;
    const res = await fetch('/api/brands/' + id, { method: 'DELETE' });
    if (res.ok) { push({ message: 'Marca removida', type: 'success' }); load(page); } else push({ message: 'Erro ao remover', type: 'error' });
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 text-xs">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium uppercase text-neutral-500">Buscar</label>
          <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Nome ou prefixo" className="rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-600 dark:bg-neutral-800" />
        </div>
      </div>
      <form onSubmit={onSubmit} className="flex flex-wrap gap-2 text-xs">
        <input placeholder="Nome" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className="rounded border border-neutral-300 px-2 py-1 dark:border-neutral-600 bg-white dark:bg-neutral-800" />
        <input placeholder="Prefixo" value={form.prefix} onChange={e=>setForm(f=>({...f,prefix:e.target.value}))} className="rounded border border-neutral-300 px-2 py-1 dark:border-neutral-600 bg-white dark:bg-neutral-800" />
        <input placeholder="From Number" value={form.fromNumber} onChange={e=>setForm(f=>({...f,fromNumber:e.target.value}))} className="rounded border border-neutral-300 px-2 py-1 dark:border-neutral-600 bg-white dark:bg-neutral-800" />
        <button type="submit" className="rounded bg-neutral-900 px-3 py-1 text-white text-[11px] disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900" disabled={loading}>Adicionar</button>
      </form>
      <table className="w-full table-fixed text-left text-[11px]"><thead><tr className="text-neutral-500"><th className="w-32">Nome</th><th className="w-32">Prefixo</th><th className="w-40">From</th><th>Criada</th><th className="w-40">Ações</th></tr></thead><tbody>{brands.map(b=> <tr key={b.id} className="border-t border-neutral-200 dark:border-neutral-800">
        <td>{editing?.id===b.id ? <input value={editing.name} onChange={e=>setEditing(ed=>ed && ({...ed,name:e.target.value}))} className="w-full rounded border border-neutral-300 bg-white px-1 py-0.5 dark:border-neutral-600 dark:bg-neutral-800"/> : b.name}</td>
        <td>{editing?.id===b.id ? <input value={editing.prefix} onChange={e=>setEditing(ed=>ed && ({...ed,prefix:e.target.value}))} className="w-full rounded border border-neutral-300 bg-white px-1 py-0.5 dark:border-neutral-600 dark:bg-neutral-800"/> : b.prefix}</td>
        <td>{editing?.id===b.id ? <input value={editing.fromNumber} onChange={e=>setEditing(ed=>ed && ({...ed,fromNumber:e.target.value}))} className="w-full rounded border border-neutral-300 bg-white px-1 py-0.5 dark:border-neutral-600 dark:bg-neutral-800"/> : b.fromNumber}</td>
        <td>{new Date(b.createdAt).toLocaleString()}</td>
        <td className="space-x-2">
          {editing?.id===b.id ? (
            <>
              <button onClick={saveEdit} className="rounded border border-emerald-300 px-2 py-0.5 text-[10px] text-emerald-700 hover:bg-emerald-50 dark:border-emerald-600 dark:text-emerald-400 dark:hover:bg-emerald-950">Salvar</button>
              <button onClick={()=>setEditing(null)} className="rounded border border-neutral-300 px-2 py-0.5 text-[10px] hover:bg-neutral-100 dark:border-neutral-600 dark:hover:bg-neutral-800">Cancelar</button>
            </>
          ) : (
            <>
              <button onClick={()=>setEditing(b)} className="rounded border border-neutral-300 px-2 py-0.5 text-[10px] hover:bg-neutral-100 dark:border-neutral-600 dark:hover:bg-neutral-800">Editar</button>
              <button onClick={()=>remove(b.id)} className="rounded border border-rose-300 px-2 py-0.5 text-[10px] text-rose-700 hover:bg-rose-50 dark:border-rose-600 dark:text-rose-400 dark:hover:bg-rose-950">Remover</button>
            </>
          )}
        </td>
      </tr>)}</tbody></table>
      <div className="flex items-center justify-end gap-2 pt-2 text-[11px]">
        <button disabled={page<=1} onClick={()=>load(page-1)} className="rounded border border-neutral-300 px-2 py-1 disabled:opacity-40 dark:border-neutral-600">Prev</button>
        <span>{page} / {pages}</span>
        <button disabled={page>=pages} onClick={()=>load(page+1)} className="rounded border border-neutral-300 px-2 py-1 disabled:opacity-40 dark:border-neutral-600">Next</button>
      </div>
    </div>
  );
}
