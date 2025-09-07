import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Button, Chip, Typography, Box, Paper, Stack } from '@mui/material';

async function getSessions() {
  return prisma.session.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
}

export default async function SessionsPage() {
  const sessions = await getSessions();
  return (
    <Box p={3} maxWidth={1000} mx="auto">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Sessões</Typography>
        <Button component={Link} href="/sessions/new" variant="contained">Criar Sessão</Button>
      </Box>
      <Stack gap={2}>
        {sessions.map(s => (
          <Paper key={s.id} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography fontWeight={600}>{s.name}</Typography>
              <Typography variant="caption">{new Date(s.createdAt as any).toLocaleString()}</Typography>
            </Box>
            <Box display="flex" gap={1} alignItems="center">
              <Chip label={s.status} color={s.status === 'RUNNING' ? 'warning' : s.status === 'COMPLETED' ? 'success' : s.status === 'FAILED' ? 'error' : 'default'} />
              {s.status === 'DRAFT' && <StartButton sessionId={s.id} />}
            </Box>
          </Paper>
        ))}
        {!sessions.length && <Typography>Nenhuma sessão.</Typography>}
      </Stack>
    </Box>
  );
}

function StartButton({ sessionId }: { sessionId: string }) {
  async function start() {
    await fetch('/api/sessions/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId }) });
    window.location.reload();
  }
  return <Button size="small" onClick={start}>Iniciar</Button>;
}
