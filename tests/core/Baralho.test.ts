import { describe, it, expect } from 'vitest';
import { criarBaralho, distribuir } from '@/core/Baralho';

describe('criarBaralho', () => {
  it('deve retornar 52 cartas', () => {
    const baralho = criarBaralho();
    expect(baralho).toHaveLength(52);
  });

  it('deve retornar cartas unicas', () => {
    const baralho = criarBaralho();
    const chaves = baralho.map((c) => `${c.valor}${c.naipe}`);
    expect(new Set(chaves).size).toBe(52);
  });

  it('deve manter ordem fixa', () => {
    const baralho = criarBaralho();
    expect(baralho[0]).toEqual({ valor: '3', naipe: '♣' });
    expect(baralho[51]).toEqual({ valor: '4', naipe: '♦' });
  });
});

describe('distribuir', () => {
  it('deve retornar 4 maos com 4 cartas cada', () => {
    const baralho = criarBaralho();
    const maos = distribuir(baralho, 4, 4);
    expect(maos).toHaveLength(4);
    maos.forEach((mao) => {
      expect(mao).toHaveLength(4);
    });
  });

  it('nao deve repetir cartas entre maos', () => {
    const baralho = criarBaralho();
    const maos = distribuir(baralho, 4, 4);
    const todas = maos.flat();
    const chaves = todas.map((c) => `${c.valor}${c.naipe}`);
    expect(new Set(chaves).size).toBe(16);
  });

  it('deve lancar erro quando nao houver cartas suficientes', () => {
    const baralho = criarBaralho();
    expect(() => distribuir(baralho, 20, 4)).toThrow(/Não há cartas suficientes/);
  });
});
