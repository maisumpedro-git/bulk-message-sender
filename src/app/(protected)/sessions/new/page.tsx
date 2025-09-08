'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '@/components/ui/toaster';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
  const { push } = useToast();
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
  const [templateQuery, setTemplateQuery] = useState('');
  const [templateLoading, setTemplateLoading] = useState(false);
  const [csvPreview, setCsvPreview] = useState<CSVPreview | null>(null);
  const [phoneColumn, setPhoneColumn] = useState('');
  const [variableMappings, setVariableMappings] = useState<VariableMappingItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Media template session-level variable (single media file) state
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [mediaInfo, setMediaInfo] = useState<{ url: string; filename: string } | null>(null);
  // Static variables (session-level) for filling numeric placeholders without CSV columns
  const [staticVars, setStaticVars] = useState<Array<{ variable: string; value: string }>>([]);
  // For media templates, which numeric placeholder to bind the media file to
  const [mediaVariable, setMediaVariable] = useState<string>('');

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
      push({ type: 'error', message: e.message || 'Erro ao carregar marcas' });
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
    loadTemplates(1); /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  const loadTemplates = useCallback(
    async (page: number, query?: string) => {
      if (!templatesHasMore && page !== 1 && !query) return;
      try {
        setTemplateLoading(true);
        const url = new URL('/api/templates', window.location.origin);
        url.searchParams.set('page', String(page));
        if (query && query.trim()) url.searchParams.set('q', query.trim());
        const res = await fetch(url.toString());
        const data = await res.json();
        if (page === 1) setTemplates(data.items);
        else setTemplates((t) => {
          const existing = new Set(t.map((i) => i.id));
          return [...t, ...data.items.filter((i: Template) => !existing.has(i.id))];
        });
        setTemplatePage(data.page);
        setTemplatesHasMore(data.hasMore);
      } catch (e: any) {
        setError(e.message);
        push({ type: 'error', message: e.message || 'Erro ao carregar templates' });
      } finally {
        setTemplateLoading(false);
      }
    },
    [templatesHasMore, push],
  );

  // Debounced search for templates with preloading
  useEffect(() => {
    const id = setTimeout(() => {
  loadTemplates(1, templateQuery);
  // Preload more pages to improve search
  setTimeout(() => loadTemplates(2, templateQuery), 100);
  setTimeout(() => loadTemplates(3, templateQuery), 200);
    }, 300);
    return () => clearTimeout(id);
  }, [templateQuery, loadTemplates]);

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
      push({ type: 'error', message: err.message || 'Erro ao processar CSV' });
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
      // Default media variable to first placeholder when template is media
      if (selectedTemplate.type === 'twilio/media') {
        setMediaVariable((prev) => prev || selectedTemplate.variables[0] || '1');
      } else {
        setMediaVariable('');
      }
    } else {
      setVariableMappings([]);
      setMediaVariable('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplate?.id]);

  // Keep exclusivity: if a variable is chosen as static or media, remove it from CSV mappings
  useEffect(() => {
    const reserved = new Set<string>([
      ...staticVars.map((s) => s.variable).filter(Boolean),
      ...(selectedTemplate?.type === 'twilio/media' && mediaVariable ? [mediaVariable] : []),
    ]);
    if (!reserved.size) return;
    setVariableMappings((prev) =>
      prev.map((m) => (m.variable && reserved.has(m.variable) ? { ...m, variable: '' } : m)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staticVars, mediaVariable]);

  // Keep exclusivity: if a variable is picked in CSV mappings, remove it from static variables
  useEffect(() => {
    const picked = new Set(variableMappings.map((m) => m.variable).filter(Boolean));
    if (!picked.size) return;
    setStaticVars((arr) => arr.filter((s) => !s.variable || !picked.has(s.variable)));
  }, [variableMappings]);

  const updateVariableMapping = (idx: number, patch: Partial<VariableMappingItem>) => {
    setVariableMappings((v) => v.map((m, i) => (i === idx ? { ...m, ...patch } : m)));
  };

  const removeVariableMapping = (idx: number) => {
    setVariableMappings((v) => v.filter((_, i) => i !== idx));
  };

  const canProceedToUpload = !!(name && brandId && templateId);
  const canProceedToReview = !!(csvPreview && phoneColumn);

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
      // Persist static variables (including media) if any
      const toPersist: Array<{ variable: string; value: string }> = [];
      // Sync media file into staticVars if present and not yet added
      if (selectedTemplate?.type === 'twilio/media' && mediaInfo) {
        const chosenVar = mediaVariable || selectedTemplate.variables[0] || '1';
        toPersist.push({ variable: chosenVar, value: mediaInfo.filename });
      }
      // Merge user-defined static variables
      for (const sv of staticVars) {
        if (sv.variable && sv.value) {
          // Avoid duplicate variable entries; media takes precedence if same variable
          if (!toPersist.some((x) => x.variable === sv.variable)) toPersist.push(sv);
        }
      }
      if (toPersist.length) {
        for (const item of toPersist) {
          const resp = await fetch('/api/sessions/static-variable', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: session.id, variable: item.variable, value: item.value }),
          });
          if (!resp.ok) throw new Error('Falha ao salvar variável estática');
        }
      }
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
  push({ type: 'success', message: `Sessão criada! Contatos válidos: ${finalizeData.contacts}` });
  // Redirect to sessions list
  router.push('/sessions');
    } catch (e: any) {
  setError(e.message);
  push({ type: 'error', message: e.message || 'Falha na criação da sessão' });
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
              <div className="mb-2 flex items-center gap-2">
                <input
                  value={templateQuery}
                  onChange={(e) => setTemplateQuery(e.target.value)}
                  placeholder="Buscar por nome ou corpo"
                  className="w-full rounded-md border border-border/70 bg-surface-alt px-3 py-2 text-sm shadow-sm focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                />
                <button
                  type="button"
                  onClick={() => loadTemplates(1, templateQuery)}
                  className="inline-flex h-9 items-center rounded-md border border-border/70 bg-surface px-3 text-sm font-medium text-fg hover:border-border"
                >
                  Buscar
                </button>
              </div>
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
                {templateLoading && (
                  <div className="py-2 text-center text-[11px] text-fg-muted">Carregando…</div>
                )}
                {templatesHasMore && !templateLoading && (
                  <button
                    type="button"
                    onClick={() => loadTemplates(templatePage + 1, templateQuery)}
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
                onClick={() => {
                  if (!canProceedToUpload) {
                    push({ type: 'error', message: 'Preencha nome, marca e template.' });
                    return;
                  }
                  setStep(2);
                }}
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
                onClick={() => {
                  if (!canProceedToReview) {
                    push({ type: 'error', message: 'Selecione a coluna de telefone e carregue o CSV.' });
                    return;
                  }
                  setStep(3);
                }}
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
              {selectedTemplate.type === 'twilio/media' && (
                <div className="mt-3 rounded-md border border-border/60 bg-surface-alt p-3 text-xs text-fg">
                  <p className="mb-2 font-medium">Mídia do Template</p>
                  <p className="mb-2 text-[11px] text-fg-muted">Upload liberado (png, jpg, mp4, pdf) até 16MB. Essa variável é por sessão.</p>
                  <div className="mb-2 flex flex-col gap-1">
                    <span className="text-[11px] font-medium text-fg-muted">Variável a preencher</span>
                    <select
                      value={mediaVariable}
                      onChange={(e) => setMediaVariable(e.target.value)}
                      className="h-8 w-fit rounded-md border border-border/70 bg-surface-alt px-2 text-xs focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                    >
                      {selectedTemplate.variables.map((v) => (
                        <option key={v} value={v}>{`{{${v}}}`}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,video/mp4,application/pdf"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        setMediaFile(f);
                        setMediaUploading(true);
                        setError(null);
                        try {
                          const fd = new FormData();
                          fd.append('file', f);
                          const up = await fetch('/api/media/upload', { method: 'POST', body: fd });
                          if (!up.ok) throw new Error('Falha ao enviar mídia');
                          const data = await up.json();
                          setMediaInfo({ url: data.url, filename: data.filename });
                        } catch (err: any) {
                          setError(err.message);
                          setMediaInfo(null);
                        } finally {
                          setMediaUploading(false);
                        }
                      }}
                      className="text-xs"
                    />
                    {mediaUploading && <span className="text-[11px] text-fg-muted">Enviando mídia...</span>}
                    {mediaInfo && !mediaUploading && (
                      <div className="flex items-center gap-2 text-[11px] text-fg-muted">
                        <span className="truncate">{mediaInfo.filename}</span>
                        <a href={mediaInfo.url} target="_blank" className="text-brand underline">
                          Abrir
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          {selectedTemplate?.hasVariables ? (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-fg-muted">
                Defina quais colunas alimentam cada variável numérica do template (ex: {'{{1}}'},{' '}
                {'{{2}}'} ).
              </p>
              {/* Static variables editor */}
              <div className="rounded-md border border-border/60 bg-surface-alt p-2">
                <div className="mb-2 text-[11px] font-medium text-fg-muted">Variáveis Estáticas (opcional)</div>
                {(staticVars.length ? staticVars : [{ variable: '', value: '' }]).map((sv, idx) => {
                  const pickedVars = new Set([
                    ...variableMappings.map((x) => x.variable).filter(Boolean),
                    ...staticVars.map((x) => x.variable).filter(Boolean),
                  ]);
                  return (
                    <div key={idx} className="mb-2 flex flex-wrap items-center gap-2">
                      <select
                        value={sv.variable}
                        onChange={(e) => {
                          const variable = e.target.value;
                          setStaticVars((arr) => {
                            const copy = [...arr];
                            if (!arr.length) copy[0] = { variable, value: sv.value };
                            else copy[idx] = { ...copy[idx], variable };
                            return copy;
                          });
                        }}
                        className="h-8 rounded-md border border-border/70 bg-surface-alt px-2 text-xs"
                      >
                        <option value="">Variável</option>
                        {selectedTemplate.variables.map((v) => (
                          <option key={v} value={v} disabled={sv.variable !== v && pickedVars.has(v)}>
                            {`{{${v}}}`}
                          </option>
                        ))}
                      </select>
                      <input
                        value={sv.value}
                        onChange={(e) => {
                          const value = e.target.value;
                          setStaticVars((arr) => {
                            const copy = [...arr];
                            if (!arr.length) copy[0] = { variable: sv.variable, value };
                            else copy[idx] = { ...copy[idx], value };
                            return copy;
                          });
                        }}
                        placeholder="Valor fixo (texto/ID)"
                        className="h-8 min-w-40 flex-1 rounded-md border border-border/70 bg-surface-alt px-2 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setStaticVars((arr) => arr.filter((_, i) => i !== idx))}
                        className="inline-flex h-8 items-center rounded-md border border-danger/40 bg-danger/10 px-2 text-[11px] font-medium text-danger"
                      >
                        Remover
                      </button>
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setStaticVars((arr) => [...arr, { variable: '', value: '' }])}
                  className="inline-flex h-8 items-center rounded-md border border-dashed border-border/70 px-2 text-[11px] font-medium text-fg-muted"
                >
                  Adicionar Variável Estática
                </button>
              </div>
              {variableMappings.map((m, idx) => {
                const pickedVars = new Set([
                  ...variableMappings.map((x) => x.variable).filter(Boolean),
                  ...staticVars.map((x) => x.variable).filter(Boolean),
                  ...(selectedTemplate?.type === 'twilio/media' && mediaVariable ? [mediaVariable] : []),
                ]);
                const pickedCols = new Set(variableMappings.map((x) => x.columnKey).filter(Boolean));
                return (
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
                        <option key={v} value={v} disabled={m.variable !== v && pickedVars.has(v)}>{`{{${v}}}`}</option>
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
                        <option key={h} value={h} disabled={m.columnKey !== h && pickedCols.has(h)}>
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
              );})}
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
