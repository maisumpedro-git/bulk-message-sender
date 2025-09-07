import { prisma } from '@/lib/prisma';
import { Box, Typography, Chip, Paper, Stack } from '@mui/material';
import Link from 'next/link';

async function getSession(id: string) {
  const session = await prisma.session.findUnique({ where: { id }, include: { brand: true, template: true } });
  if (!session) return null;
  const grouped = await prisma.outboundMessage.groupBy({ by: ['status'], where: { sessionId: id }, _count: { _all: true } });
  const counts = { sent: 0, failed: 0, pending: 0, total: 0 };
  for (const g of grouped) {
    const n = (g as any)._count._all as number;
    if (g.status === 'SENT') counts.sent += n; else if (g.status === 'FAILED') counts.failed += n; else if (g.status === 'PENDING') counts.pending += n; counts.total += n;
  }
  return { session, counts };
}

export default async function SessionDetail({ params }: { params: { id: string } }) {
  const data = await getSession(params.id);
  if (!data) return <Box p={3}><Typography>Sessão não encontrada</Typography></Box>;
  const { session, counts } = data;
  return (
    <Box p={3} maxWidth={900} mx="auto" display="flex" flexDirection="column" gap={2}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h4">Sessão: {session.name}</Typography>
        <Chip label={session.status} color={session.status === 'RUNNING' ? 'warning' : session.status === 'COMPLETED' ? 'success' : session.status === 'FAILED' ? 'error' : 'default'} />
      </Box>
      <Typography variant="body2">Criada em: {new Date(session.createdAt as any).toLocaleString()}</Typography>
      <Typography variant="body2">Marca: {session.brand.name}</Typography>
      <Typography variant="body2">Template: {session.template.name}</Typography>
      <Paper sx={{ p:2 }}>
        <Typography variant="h6" gutterBottom>Estatísticas</Typography>
        <Stack direction="row" gap={3} flexWrap="wrap">
          <Stat label="Total" value={counts.total} />
          <Stat label="Enviados" value={counts.sent} />
            <Stat label="Falhados" value={counts.failed} />
            <Stat label="Pendentes" value={counts.pending} />
        </Stack>
      </Paper>
      <Typography component={Link} href="/sessions" style={{ textDecoration:'none' }}>Voltar</Typography>
    </Box>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <Box><Typography variant="caption" display="block">{label}</Typography><Typography fontWeight={600}>{value}</Typography></Box>;
}
