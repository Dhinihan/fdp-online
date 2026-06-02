import { describe, expect, it } from 'vitest';
import { clampOffsetRolagem, offsetMaximoRolagem, precisaRolar } from '@/adapters/phaser/scenes/rolagem-tabela-ranking';

describe('offsetMaximoRolagem', () => {
  it('deve ser zero quando o conteúdo cabe na área visível', () => {
    expect(offsetMaximoRolagem(300, 400)).toBe(0);
  });

  it('deve ser zero quando o conteúdo é exatamente do tamanho visível', () => {
    expect(offsetMaximoRolagem(400, 400)).toBe(0);
  });

  it('deve ser a sobra quando o conteúdo transborda', () => {
    expect(offsetMaximoRolagem(700, 400)).toBe(300);
  });
});

describe('precisaRolar', () => {
  it('deve retornar false quando a lista curta cabe na tela', () => {
    expect(precisaRolar(300, 400)).toBe(false);
  });

  it('deve retornar true quando o roster ultrapassa a área visível', () => {
    expect(precisaRolar(700, 400)).toBe(true);
  });
});

describe('clampOffsetRolagem', () => {
  it('deve prender no topo quando o deslocamento é negativo', () => {
    expect(clampOffsetRolagem(-50, 300)).toBe(0);
  });

  it('deve prender no fim quando o deslocamento passa do limite', () => {
    expect(clampOffsetRolagem(500, 300)).toBe(300);
  });

  it('deve preservar o deslocamento dentro dos limites', () => {
    expect(clampOffsetRolagem(120, 300)).toBe(120);
  });
});
