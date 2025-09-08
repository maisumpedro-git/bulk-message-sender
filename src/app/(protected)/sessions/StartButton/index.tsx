'use client';
import React from 'react';
import { Button } from '@/components/ui/button';

interface StartButtonProps {
  sessionId: string;
}

export default function StartButton({ sessionId }: StartButtonProps) {
  async function handleClick() {
    await fetch('/api/sessions/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });
    window.location.reload();
  }
  return (
    <Button size="sm" variant="outline" onClick={handleClick}>
      Iniciar
    </Button>
  );
}
