import { describe, it, expect } from 'vitest';
import { normalizePhone } from '@/lib/messageQueue';

describe('normalizePhone', () => {
  it('normaliza número BR válido', () => {
    expect(normalizePhone('(11) 91234-5678')?.startsWith('+55')).toBe(true);
  });
  it('retorna null para inválido', () => {
    expect(normalizePhone('123')).toBeNull();
  });
});
