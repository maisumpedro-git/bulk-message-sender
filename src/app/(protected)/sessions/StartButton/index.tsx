"use client";
import { Button } from '@mui/material';

export default function StartButton({ sessionId }: { sessionId: string }) {
  async function start() {
    await fetch('/api/sessions/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId }) });
    window.location.reload();
  }
  return <Button size="small" onClick={start}>Iniciar</Button>;
}
