"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { Paper, Stack, Typography, Box, Chip, LinearProgress } from '@mui/material';
import StartButton from './StartButton';
import Link from 'next/link';

type SessionWithCounts = {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  sent?: number;
  failed?: number;
  pending?: number;
  total?: number;
};

export default function SessionsLive() {
  const [sessions, setSessions] = useState<SessionWithCounts[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/sessions?stats=1', { cache: 'no-store' });
      const data = await res.json();
      setSessions(data);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, [load]);

  return (
    <Stack gap={2}>
      {loading && !sessions.length && <Typography>Carregando...</Typography>}
      {sessions.map(s => {
        const total = s.total || 0;
        const sent = s.sent || 0;
        const failed = s.failed || 0;
        const pending = s.pending || 0;
        const progress = total ? ((sent + failed) / total) * 100 : 0;
        return (
          <Paper key={s.id} sx={{ p:2, display:'flex', flexDirection:'column', gap:1 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography fontWeight={600} component={Link} href={`/sessions/${s.id}`} style={{ textDecoration:'none' }}>{s.name}</Typography>
                <Typography variant="caption">{new Date(s.createdAt as any).toLocaleString()}</Typography>
              </Box>
              <Box display="flex" gap={1} alignItems="center">
                <Chip label={s.status} color={s.status === 'RUNNING' ? 'warning' : s.status === 'COMPLETED' ? 'success' : s.status === 'FAILED' ? 'error' : 'default'} />
                {s.status === 'DRAFT' && <StartButton sessionId={s.id} />}
              </Box>
            </Box>
            {(s.status === 'RUNNING' || s.status === 'COMPLETED' || s.status === 'FAILED') && total > 0 && (
              <Box>
                <LinearProgress variant="determinate" value={progress} sx={{ height:6, borderRadius:1, mb:0.5 }} />
                <Typography variant="caption">Enviados: {sent} | Falhados: {failed} | Pendentes: {pending} | Total: {total}</Typography>
              </Box>
            )}
          </Paper>
        );
      })}
      {!loading && !sessions.length && <Typography>Nenhuma sessão.</Typography>}
    </Stack>
  );
}
