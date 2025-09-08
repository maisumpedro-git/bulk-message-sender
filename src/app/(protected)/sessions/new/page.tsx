'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

type Brand = { id: string; name: string; prefix: string; fromNumber: string };
type Template = {
  id: string;
  name: string;
  type: string;
  body: string;
  variables: string[];
  hasVariables: boolean;
  templateRefId?: string | null;
};

interface CSVPreview {
  headers: string[];
  rows: Record<string, string>[];
}

interface VariableMappingItem {
  variable: string;
  columnKey: string;
}

export default function NewSessionPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState('');
  const [brandId, setBrandId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandPage, setBrandPage] = useState(1);
  const [brandsHasMore, setBrandsHasMore] = useState(true);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatePage, setTemplatePage] = useState(1);
  const [templatesHasMore, setTemplatesHasMore] = useState(true);
  const [csvPreview, setCsvPreview] = useState<CSVPreview | null>(null);
  const [phoneColumn, setPhoneColumn] = useState('');
  const [variableMappings, setVariableMappings] = useState<VariableMappingItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load brands paginated (infinite scroll)
  const loadBrands = useCallback(async (page: number) => {
    if (loadingBrands) return;
    if (!brandsHasMore && page !== 1) return;
    try {
      setLoadingBrands(true);
      const res = await fetch(`/api/brands?page=${page}&pageSize=20`);
      const data = await res.json();
      const items: Brand[] = Array.isArray(data) ? data : data.items;
      if (page === 1) setBrands(items);
      else {
        setBrands((prev) => {
          const existing = new Set(prev.map((b) => b.id));
            return [...prev, ...items.filter((b) => !existing.has(b.id))];
        });
      }
      const pages = data.pages ?? (items.length < 20 ? page : page + 1); // fallback if legacy
      setBrandPage(data.page || page);
      setBrandsHasMore((data.page || page) < pages);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingBrands(false);
    }
  }, [brandsHasMore, loadingBrands]);

  // Carrega marcas apenas uma vez no primeiro render para evitar loop
  useEffect(() => {
    loadBrands(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load initial templates
  useEffect(() => {
    loadTemplates(templatePage); /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  const loadTemplates = useCallback(
    async (page: number) => {
      if (!templatesHasMore && page !== 1) return;
      try {
        const res = await fetch(`/api/templates?page=${page}`);
        const data = await res.json();
        if (page === 1) setTemplates(data.items);
        else setTemplates((t) => [...t, ...data.items]);
        setTemplatePage(data.page);
        setTemplatesHasMore(data.hasMore);
      } catch (e: any) {
        setError(e.message);
      }
    },
    [templatesHasMore],
  );

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === templateId),
    [templateId, templates],
  );

  // keep original file for finalize step
  const csvFileRef = React.useRef<File | null>(null);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    csvFileRef.current = file;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/sessions/upload-contacts', {
        method: 'POST',
        body: fd,
      });
      if (!res.ok) throw new Error('Falha ao processar CSV');
      const data = await res.json();
      const rows: Record<string, string>[] = data.sample;
      const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
      setCsvPreview({ headers, rows });
      if (headers.length) setPhoneColumn(headers[0]);
      // initialize variable mappings blank
      setVariableMappings([]);
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const addVariableMapping = () => {
    setVariableMappings((v) => [...v, { variable: '', columnKey: '' }]);
  };

  // When selecting a template with variables numeric like ['1','2'] pre-fill mapping rows if empty
  useEffect(() => {
    if (selectedTemplate && selectedTemplate.hasVariables) {
      if (!variableMappings.length) {
        setVariableMappings(
          selectedTemplate.variables.map((v) => ({ variable: v, columnKey: '' })),
        );
      }
    } else {
      setVariableMappings([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplate?.id]);

  const updateVariableMapping = (idx: number, patch: Partial<VariableMappingItem>) => {
    setVariableMappings((v) => v.map((m, i) => (i === idx ? { ...m, ...patch } : m)));
  };

  const removeVariableMapping = (idx: number) => {
    setVariableMappings((v) => v.filter((_, i) => i !== idx));
  };

  const canProceedToUpload = name && brandId && templateId;
  const canProceedToReview = csvPreview && phoneColumn;

  const submitAll = async () => {
    setCreating(true);
    setError(null);
    try {
      // 0. Ensure TemplateReference exists (create if needed)
      const chosen = selectedTemplate;
      if (!chosen) throw new Error('Template não selecionado');
      let templateRefId = chosen.templateRefId;
      if (!templateRefId) {
        const createRes = await fetch('/api/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            twilioId: chosen.id,
            name: chosen.name,
            hasVariables: chosen.hasVariables,
          }),
        });
        if (!createRes.ok) throw new Error('Falha ao registrar template');
        const created = await createRes.json();
        templateRefId = created.id;
        // update local state so subsequent sessions reuse
        setTemplates((ts) => ts.map((t) => (t.id === chosen.id ? { ...t, templateRefId } : t)));
      }
      // 1. Create session (usa cuid do TemplateReference)
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, brandId, templateId: templateRefId }),
      });
      if (!res.ok) throw new Error('Erro ao criar sessão');
      const session = await res.json();
      if (!csvFileRef.current) throw new Error('Arquivo CSV ausente');
      const fd = new FormData();
      fd.append('sessionId', session.id);
      fd.append('phoneColumn', phoneColumn);
      fd.append('file', csvFileRef.current);
      fd.append(
        'variableMappings',
        JSON.stringify(variableMappings.filter((m) => m.variable && m.columnKey)),
      );
      const finalizeRes = await fetch('/api/sessions/finalize', {
        method: 'POST',
        body: fd,
      });
      if (!finalizeRes.ok) throw new Error('Falha ao salvar contatos');
      const finalizeData = await finalizeRes.json();
      alert('Sessão criada! Contatos válidos: ' + finalizeData.contacts);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-fg">Nova Sessão de Disparo</h1>
      {error && (
        <div className="mb-4 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}
      <ol className="mb-6 flex gap-4 text-sm font-medium">
        {['Definições', 'Upload', 'Mapeamento'].map((label, i) => (
          <li
            key={label}
            className={`flex items-center gap-2 ${step === i + 1 ? 'text-neutral-900' : 'text-neutral-400'}`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${step === i + 1 ? 'border-brand bg-brand text-white shadow-subtle' : 'border-border/60 text-fg-muted'}`}
            >
              {i + 1}
            </span>
            {label}
          </li>
        ))}
      </ol>
      {step === 1 && (
        <section className="mb-8 rounded-md border border-border/60 bg-surface p-5 shadow-subtle">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-fg-muted">
            1. Definições Básicas
          </h2>
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-fg">Nome da Sessão</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Campanha Primavera"
                className="rounded-md border border-border/70 bg-surface-alt px-3 py-2 text-sm shadow-sm focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              />
            </label>
            <div className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-fg">Marca</span>
              <div
                className="flex max-h-60 flex-col gap-1 overflow-auto rounded-md border border-border/70 bg-surface-alt p-1 shadow-sm focus-within:ring-2 focus-within:ring-brand/40"
                onScroll={(e) => {
                  const el = e.currentTarget;
                  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) {
                    if (!loadingBrands && brandsHasMore) loadBrands(brandPage + 1);
                  }
                }}
              >
                {brands.map((b) => {
                  const active = brandId === b.id;
                  return (
                    <button
                      type="button"
                      key={b.id}
                      onClick={() => setBrandId(b.id)}
                      className={`flex items-center justify-between rounded-md border px-2 py-1 text-left text-xs font-medium transition-colors ${active ? 'border-brand bg-brand text-white shadow-subtle' : 'border-border/60 bg-surface hover:border-border hover:bg-surface-alt'}`}
                    >
                      <span className="truncate">{b.prefix} - {b.name}</span>
                      {active && <span className="text-[9px] uppercase tracking-wide">Selecionado</span>}
                    </button>
                  );
                })}
                {loadingBrands && (
                  <div className="py-2 text-center text-[11px] text-fg-muted">Carregando...</div>
                )}
                {!loadingBrands && brandsHasMore && (
                  <div className="py-2 text-center text-[11px] text-fg-muted/70">Role para carregar mais…</div>
                )}
                {!brands.length && !loadingBrands && (
                  <div className="py-2 text-center text-[11px] text-fg-muted">Nenhuma marca.</div>
                )}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-fg">Template</p>
              <div className="flex max-h-60 flex-col gap-2 overflow-auto rounded-md border border-border/70 bg-surface-alt p-2">
                {templates.map((t) => {
                  const active = templateId === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTemplateId(t.id)}
                      className={`flex items-center gap-2 rounded-md border px-2 py-1 text-left text-sm ${active ? 'border-brand bg-brand text-white shadow-subtle' : 'border-border/70 bg-surface hover:border-border hover:bg-surface-alt'}`}
                    >
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${t.hasVariables ? 'bg-info/15 text-info' : 'bg-fg-muted/10 text-fg-muted'}`}
                      >
                        {t.hasVariables ? 'Vars' : 'Fixo'}
                      </span>
                      <span className="rounded bg-fg-muted/10 px-1.5 py-0.5 text-[10px] font-medium text-fg-muted">
                        {t.type.replace('twilio/', '')}
                      </span>
                      <span className="truncate font-medium">{t.name}</span>
                    </button>
                  );
                })}
                {templatesHasMore && (
                  <button
                    type="button"
                    onClick={() => loadTemplates(templatePage + 1)}
                    className="rounded-md border border-dashed border-border/70 px-3 py-1 text-xs font-medium text-fg-muted hover:border-border"
                  >
                    Carregar mais
                  </button>
                )}
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                disabled={!canProceedToUpload}
                onClick={() => setStep(2)}
                className="inline-flex h-9 items-center rounded-md bg-brand px-4 text-sm font-medium text-white shadow-subtle hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                Próximo
              </button>
            </div>
          </div>
        </section>
      )}
      {step === 2 && (
        <section className="mb-8 rounded-md border border-border/60 bg-surface p-5 shadow-subtle">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-fg-muted">
            2. Upload da Lista
          </h2>
          <div className="flex flex-col gap-4">
            <label className="inline-flex w-fit cursor-pointer items-center justify-center rounded-md border border-border/70 bg-surface-alt px-4 py-2 text-sm font-medium shadow-sm hover:bg-surface-alt/80">
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={onFileChange}
                className="hidden"
              />
              {uploading ? 'Processando...' : 'Selecionar CSV'}
            </label>
            {uploading && <p className="text-xs text-fg-muted">Processando arquivo...</p>}
            {csvPreview && (
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-fg-muted/80">
                  Colunas detectadas:
                </p>
                <div className="mb-2 flex flex-wrap gap-1">
                  {csvPreview.headers.map((h) => (
                    <span
                      key={h}
                      className="rounded bg-fg-muted/10 px-2 py-0.5 text-[10px] font-medium text-fg-muted"
                    >
                      {h}
                    </span>
                  ))}
                </div>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-fg">Coluna de Telefone</span>
                  <select
                    value={phoneColumn}
                    onChange={(e) => setPhoneColumn(e.target.value)}
                    className="rounded-md border border-border/70 bg-surface-alt px-3 py-2 text-sm shadow-sm focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                  >
                    {csvPreview.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}
            <div className="mt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-sm font-medium text-fg-muted hover:underline"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={!canProceedToReview}
                onClick={() => setStep(3)}
                className="inline-flex h-9 items-center rounded-md bg-brand px-4 text-sm font-medium text-white shadow-subtle hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                Próximo
              </button>
            </div>
          </div>
        </section>
      )}
      {step === 3 && (
        <section className="mb-8 rounded-md border border-border/60 bg-surface p-5 shadow-subtle">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-fg-muted">
            3. Mapeamento de Variáveis
          </h2>
          {selectedTemplate && (
            <div className="mb-4">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-fg-muted/80">
                Preview do Template ({selectedTemplate.type})
              </p>
              <pre className="whitespace-pre-wrap rounded-md border border-border/60 bg-surface-alt p-2 text-xs text-fg">
                {selectedTemplate.body || 'Sem conteúdo'}
              </pre>
            </div>
          )}
          {selectedTemplate?.hasVariables ? (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-fg-muted">
                Defina quais colunas alimentam cada variável numérica do template (ex: {'{{1}}'},{' '}
                {'{{2}}'} ).
              </p>
              {variableMappings.map((m, idx) => (
                <div
                  key={idx}
                  className="flex flex-wrap items-center gap-2 rounded-md border border-border/60 bg-surface-alt p-2"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-medium text-fg-muted">Variável</span>
                    <select
                      value={m.variable}
                      onChange={(e) => updateVariableMapping(idx, { variable: e.target.value })}
                      className="h-9 rounded-md border border-border/70 bg-surface-alt px-2 text-sm focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                    >
                      <option value="">Selecione</option>
                      {selectedTemplate.variables.map((v) => (
                        <option key={v} value={v}>{`{{${v}}}`}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-medium text-fg-muted">Coluna</span>
                    <select
                      value={m.columnKey}
                      onChange={(e) => updateVariableMapping(idx, { columnKey: e.target.value })}
                      className="h-9 rounded-md border border-border/70 bg-surface-alt px-2 text-sm focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                    >
                      <option value="">Selecione</option>
                      {csvPreview?.headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeVariableMapping(idx)}
                    className="ml-auto inline-flex h-9 items-center rounded-md border border-danger/40 bg-danger/10 px-3 text-xs font-medium text-danger hover:bg-danger/15"
                  >
                    Remover
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addVariableMapping}
                className="inline-flex w-fit items-center rounded-md border border-dashed border-border/70 px-3 py-1 text-xs font-medium text-fg-muted hover:border-border"
              >
                Adicionar Variável
              </button>
              <hr className="my-2 border-border/50" />
            </div>
          ) : (
            <p className="text-sm text-fg-muted">Template não possui variáveis.</p>
          )}
          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="text-sm font-medium text-fg-muted hover:underline"
            >
              Voltar
            </button>
            <button
              type="button"
              disabled={creating}
              onClick={submitAll}
              className="inline-flex h-9 items-center rounded-md bg-brand px-4 text-sm font-medium text-white shadow-subtle hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creating ? 'Criando...' : 'Criar Sessão'}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
