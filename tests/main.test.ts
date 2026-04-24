import { describe, it, expect } from 'vitest';

describe('Infraestrutura', () => {
  it('deve importar src/main.ts sem lançar erro', async () => {
    const modulo = await import('../src/main.ts');
    expect(modulo).toBeDefined();
  });
});
