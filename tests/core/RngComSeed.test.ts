import { describe, expect, it } from 'vitest';
import { RngComSeed } from '@/core/RngComSeed';

describe('RngComSeed', () => {
  it('deve produzir sequencia deterministica para seed fixa', () => {
    const primeiro = new RngComSeed(1337);
    const segundo = new RngComSeed(1337);

    expect([primeiro.random(), primeiro.random(), primeiro.random()]).toEqual([
      segundo.random(),
      segundo.random(),
      segundo.random(),
    ]);
  });

  it('deve produzir sequencias diferentes para seeds diferentes', () => {
    const primeiro = new RngComSeed(1337);
    const segundo = new RngComSeed(42);

    expect([primeiro.random(), primeiro.random(), primeiro.random()]).not.toEqual([
      segundo.random(),
      segundo.random(),
      segundo.random(),
    ]);
  });

  it('deve rejeitar seed nao finita ou decimal', () => {
    expect(() => new RngComSeed(Number.NaN)).toThrow(TypeError);
    expect(() => new RngComSeed(Number.POSITIVE_INFINITY)).toThrow(TypeError);
    expect(() => new RngComSeed(13.37)).toThrow(TypeError);
  });
});

describe('RngComSeed — utilitarios', () => {
  it('deve gerar inteiros dentro dos limites inclusivos', () => {
    const rng = new RngComSeed(1337);
    const valores = Array.from({ length: 100 }, () => rng.randomInt(2, 5));

    expect(valores.every((valor) => Number.isInteger(valor) && valor >= 2 && valor <= 5)).toBe(true);
  });

  it('deve embaralhar de forma deterministica sem alterar o array original', () => {
    const original = [1, 2, 3, 4, 5, 6];
    const primeiro = new RngComSeed(1337).shuffle(original);
    const segundo = new RngComSeed(1337).shuffle(original);

    expect(primeiro).toEqual(segundo);
    expect(primeiro).not.toEqual(original);
    expect(original).toEqual([1, 2, 3, 4, 5, 6]);
  });
});
