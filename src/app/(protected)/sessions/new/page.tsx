"use client";
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Stepper, Step, StepLabel, TextField, Button, Select, MenuItem, FormControl, InputLabel, Typography, Paper, CircularProgress, IconButton, Divider, Chip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

type Brand = { id: string; name: string; prefix: string; fromNumber: string };
type Template = { id: string; name: string; hasVariables: boolean };

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
  const [name, setName] = useState("");
  const [brandId, setBrandId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatePage, setTemplatePage] = useState(1);
  const [templatesHasMore, setTemplatesHasMore] = useState(true);
  const [csvPreview, setCsvPreview] = useState<CSVPreview | null>(null);
  const [phoneColumn, setPhoneColumn] = useState("");
  const [variableMappings, setVariableMappings] = useState<VariableMappingItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load brands once
  useEffect(() => {
    fetch('/api/brands').then(r => r.json()).then(setBrands).catch(e => setError(e.message));
  }, []);

  // Load initial templates
  useEffect(() => { loadTemplates(templatePage); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const loadTemplates = useCallback(async (page: number) => {
    if (!templatesHasMore && page !== 1) return;
    try {
      const res = await fetch(`/api/templates?page=${page}`);
      const data = await res.json();
      if (page === 1) setTemplates(data.items);
      else setTemplates(t => [...t, ...data.items]);
      setTemplatePage(data.page);
      setTemplatesHasMore(data.hasMore);
    } catch (e: any) {
      setError(e.message);
    }
  }, [templatesHasMore]);

  const selectedTemplate = useMemo(() => templates.find(t => t.id === templateId), [templateId, templates]);

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
      const res = await fetch('/api/sessions/upload-contacts', { method: 'POST', body: fd });
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
    setVariableMappings(v => [...v, { variable: '', columnKey: '' }]);
  };

  const updateVariableMapping = (idx: number, patch: Partial<VariableMappingItem>) => {
    setVariableMappings(v => v.map((m, i) => i === idx ? { ...m, ...patch } : m));
  };

  const removeVariableMapping = (idx: number) => {
    setVariableMappings(v => v.filter((_, i) => i !== idx));
  };

  const canProceedToUpload = name && brandId && templateId;
  const canProceedToReview = csvPreview && phoneColumn;

  const submitAll = async () => {
    setCreating(true);
    setError(null);
    try {
      // 1. Create session (DRAFT)
      const res = await fetch('/api/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, brandId, templateId }) });
      if (!res.ok) throw new Error('Erro ao criar sessão');
      const session = await res.json();
  if (!csvFileRef.current) throw new Error('Arquivo CSV ausente');
  const fd = new FormData();
  fd.append('sessionId', session.id);
  fd.append('phoneColumn', phoneColumn);
  fd.append('file', csvFileRef.current);
  fd.append('variableMappings', JSON.stringify(variableMappings.filter(m => m.variable && m.columnKey)));
  const finalizeRes = await fetch('/api/sessions/finalize', { method: 'POST', body: fd });
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
    <Box maxWidth={1000} mx="auto" p={2}>
      <Typography variant="h4" gutterBottom>Nova Sessão de Disparo</Typography>
      {error && <Typography color="error" mb={2}>{error}</Typography>}
      <Stepper activeStep={step - 1} sx={{ mb: 3 }}>
        {['Definições', 'Upload', 'Mapeamento'].map(label => (
          <Step key={label}><StepLabel>{label}</StepLabel></Step>
        ))}
      </Stepper>
      {step === 1 && (
        <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Typography variant="h6">1. Definições Básicas</Typography>
          <TextField label="Nome da Sessão" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} fullWidth placeholder="Campanha Primavera" />
          <FormControl fullWidth>
            <InputLabel id="brand-label">Marca</InputLabel>
            <Select labelId="brand-label" label="Marca" value={brandId} onChange={(e: any) => setBrandId(e.target.value as string)}>
              <MenuItem value=""><em>Selecione</em></MenuItem>
              {brands.map(b => <MenuItem value={b.id} key={b.id}>{b.prefix} - {b.name}</MenuItem>)}
            </Select>
          </FormControl>
          <Box>
            <Typography variant="subtitle1" gutterBottom>Template</Typography>
            <Paper variant="outlined" sx={{ p: 1, maxHeight: 240, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
              {templates.map(t => (
                <Paper key={t.id} variant={templateId === t.id ? 'elevation' : 'outlined'} sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }} onClick={() => setTemplateId(t.id)}>
                  <Chip size="small" color={t.hasVariables ? 'secondary' : 'default'} label={t.hasVariables ? 'Vars' : 'Fixo'} />
                  <Typography fontWeight={templateId === t.id ? 600 : 400}>{t.name}</Typography>
                </Paper>
              ))}
              {templatesHasMore && <Button onClick={() => loadTemplates(templatePage + 1)}>Carregar mais</Button>}
            </Paper>
          </Box>
          <Box display="flex" gap={2} justifyContent="flex-end">
            <Button variant="contained" disabled={!canProceedToUpload} onClick={() => setStep(2)}>Próximo</Button>
          </Box>
        </Paper>
      )}
      {step === 2 && (
        <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h6">2. Upload da Lista</Typography>
          <Button variant="outlined" component="label" disabled={uploading}>
            {uploading ? 'Processando...' : 'Selecionar CSV'}
            <input hidden type="file" accept=".csv,text/csv" onChange={onFileChange} />
          </Button>
          {uploading && <CircularProgress size={24} />}
          {csvPreview && (
            <Box>
              <Typography variant="body2" mb={1}>Colunas detectadas:</Typography>
              <Box display="flex" flexWrap="wrap" gap={1} mb={2}>{csvPreview.headers.map(h => <Chip key={h} label={h} />)}</Box>
              <FormControl fullWidth>
                <InputLabel id="phone-col">Coluna de Telefone</InputLabel>
                <Select labelId="phone-col" label="Coluna de Telefone" value={phoneColumn} onChange={(e: any) => setPhoneColumn(e.target.value as string)}>
                  {csvPreview.headers.map(h => <MenuItem value={h} key={h}>{h}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
          )}
          <Box display="flex" gap={2} justifyContent="space-between" mt={1}>
            <Button onClick={() => setStep(1)}>Voltar</Button>
            <Button variant="contained" disabled={!canProceedToReview} onClick={() => setStep(3)}>Próximo</Button>
          </Box>
        </Paper>
      )}
      {step === 3 && (
        <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h6">3. Mapeamento de Variáveis</Typography>
            {selectedTemplate?.hasVariables ? (
              <Box display="flex" flexDirection="column" gap={2}>
                <Typography variant="body2">Defina quais colunas alimentam cada variável do template (ex: {'{{nome}}'}).</Typography>
                {variableMappings.map((m, idx) => (
                  <Paper key={idx} variant="outlined" sx={{ p: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
                    <TextField size="small" label="Variável" placeholder="nome" value={m.variable} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateVariableMapping(idx, { variable: e.target.value })} />
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                      <InputLabel id={`col-${idx}`}>Coluna</InputLabel>
                      <Select labelId={`col-${idx}`} label="Coluna" value={m.columnKey} onChange={(e: any) => updateVariableMapping(idx, { columnKey: e.target.value as string })}>
                        <MenuItem value=""><em>Selecione</em></MenuItem>
                        {csvPreview?.headers.map(h => <MenuItem value={h} key={h}>{h}</MenuItem>)}
                      </Select>
                    </FormControl>
                    <IconButton aria-label="remover" onClick={() => removeVariableMapping(idx)}>
                      <DeleteIcon />
                    </IconButton>
                  </Paper>
                ))}
                <Button onClick={addVariableMapping}>Adicionar Variável</Button>
                <Divider />
              </Box>
            ) : <Typography variant="body2">Template não possui variáveis.</Typography>}
          <Box display="flex" gap={2} justifyContent="space-between" mt={1}>
            <Button onClick={() => setStep(2)}>Voltar</Button>
            <Button variant="contained" disabled={creating} onClick={submitAll}>{creating ? 'Criando...' : 'Criar Sessão'}</Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
}
