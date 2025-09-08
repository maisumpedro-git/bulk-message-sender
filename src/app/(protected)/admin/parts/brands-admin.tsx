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
          <label className="text-[10px] font-medium uppercase text-fg-muted">Buscar</label>
          <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Nome ou prefixo" className="rounded-md border border-border/70 bg-surface-alt px-2 py-1 text-xs focus-visible:border-brand focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand/40" />
        </div>
      </div>
      <form onSubmit={onSubmit} className="flex flex-wrap gap-2 text-xs">
        <input placeholder="Nome" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className="rounded-md border border-border/70 bg-surface-alt px-2 py-1 focus-visible:border-brand focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand/40" />
        <input placeholder="Prefixo" value={form.prefix} onChange={e=>setForm(f=>({...f,prefix:e.target.value}))} className="rounded-md border border-border/70 bg-surface-alt px-2 py-1 focus-visible:border-brand focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand/40" />
        <input placeholder="From Number" value={form.fromNumber} onChange={e=>setForm(f=>({...f,fromNumber:e.target.value}))} className="rounded-md border border-border/70 bg-surface-alt px-2 py-1 focus-visible:border-brand focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand/40" />
        <button type="submit" className="rounded-md bg-brand px-3 py-1 text-white text-[11px] shadow-subtle hover:bg-brand-hover disabled:opacity-50" disabled={loading}>Adicionar</button>
      </form>
      <table className="w-full table-fixed text-left text-[11px]"><thead><tr className="text-fg-muted"><th className="w-32">Nome</th><th className="w-32">Prefixo</th><th className="w-40">From</th><th>Criada</th><th className="w-40">Ações</th></tr></thead><tbody>{brands.map(b=> <tr key={b.id} className="border-t border-border/60">
        <td>{editing?.id===b.id ? <input value={editing.name} onChange={e=>setEditing(ed=>ed && ({...ed,name:e.target.value}))} className="w-full rounded-md border border-border/70 bg-surface-alt px-1 py-0.5 focus-visible:border-brand focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand/40"/> : b.name}</td>
        <td>{editing?.id===b.id ? <input value={editing.prefix} onChange={e=>setEditing(ed=>ed && ({...ed,prefix:e.target.value}))} className="w-full rounded-md border border-border/70 bg-surface-alt px-1 py-0.5 focus-visible:border-brand focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand/40"/> : b.prefix}</td>
        <td>{editing?.id===b.id ? <input value={editing.fromNumber} onChange={e=>setEditing(ed=>ed && ({...ed,fromNumber:e.target.value}))} className="w-full rounded-md border border-border/70 bg-surface-alt px-1 py-0.5 focus-visible:border-brand focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand/40"/> : b.fromNumber}</td>
        <td>{new Date(b.createdAt).toLocaleString()}</td>
        <td className="space-x-2">
          {editing?.id===b.id ? (
            <>
              <button onClick={saveEdit} className="rounded-md border border-success/40 bg-success/15 px-2 py-0.5 text-[10px] text-success hover:bg-success/20">Salvar</button>
              <button onClick={()=>setEditing(null)} className="rounded-md border border-border/70 bg-surface-alt px-2 py-0.5 text-[10px] hover:bg-surface-alt/70">Cancelar</button>
            </>
          ) : (
            <>
              <button onClick={()=>setEditing(b)} className="rounded-md border border-border/70 bg-surface-alt px-2 py-0.5 text-[10px] hover:bg-surface-alt/70">Editar</button>
              <button onClick={()=>remove(b.id)} className="rounded-md border border-danger/40 bg-danger/15 px-2 py-0.5 text-[10px] text-danger hover:bg-danger/20">Remover</button>
            </>
          )}
        </td>
      </tr>)}</tbody></table>
      <div className="flex items-center justify-end gap-2 pt-2 text-[11px]">
        <button disabled={page<=1} onClick={()=>load(page-1)} className="rounded-md border border-border/70 bg-surface-alt px-2 py-1 disabled:opacity-40">Prev</button>
        <span>{page} / {pages}</span>
        <button disabled={page>=pages} onClick={()=>load(page+1)} className="rounded-md border border-border/70 bg-surface-alt px-2 py-1 disabled:opacity-40">Next</button>
      </div>
    </div>
  );
}
