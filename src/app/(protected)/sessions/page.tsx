import Link from 'next/link';
import { Button, Typography, Box,  } from '@mui/material';
import SessionsLive from './SessionsLive';

export default function SessionsPage() {
  // Wrapper to render client live component (for polling) keeping server layout simple
  return (
    <Box p={3} maxWidth={1000} mx="auto">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Sessões</Typography>
        <Button component={Link} href="/sessions/new" variant="contained">Criar Sessão</Button>
      </Box>
      <SessionsLive />
    </Box>
  );
}
