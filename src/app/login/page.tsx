'use client';
import { signIn } from 'next-auth/react';
import { FormEvent, useState } from 'react';
import { Box, Button, TextField, Paper, Typography, Alert } from '@mui/material';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await signIn('credentials', { redirect: false, email, password });
    if (res?.error) setError('Credenciais inválidas');
    else window.location.href = '/';
    setLoading(false);
  }

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh" p={2}>
      <Paper sx={{ p: 4, width: 360, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h5" fontWeight={600}>Login</Typography>
        {error && <Alert severity="error">{error}</Alert>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <TextField label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required fullWidth />
            <TextField label="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} required fullWidth />
          <Button type="submit" variant="contained" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</Button>
        </form>
      </Paper>
    </Box>
  );
}
