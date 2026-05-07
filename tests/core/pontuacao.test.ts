import { describe, expect, it } from 'vitest';
import { calcularPontuacao } from '@/core/pontuacao';

const jogadoresIds = ['j1', 'j2', 'j3', 'j4'];

function calcular(declaracoes: Record<string, number>, vazas: Record<string, number>, pontos = 5) {
  return calcularPontuacao({
    declaracoes,
    vazas,
    pontosAtuais: Object.fromEntries(jogadoresIds.map((jogadorId) => [jogadorId, pontos])),
    jogadoresIds,
  });
}

describe('Pontuação', () => {
  it('deve manter pontos quando declarou 3 e fez 3', () => {
    expect(calcular({ j1: 3 }, { j1: 3 }).pontos.j1).toBe(5);
  });

  it('deve perder 2 pontos quando declarou 3 e fez 1', () => {
    expect(calcular({ j1: 3 }, { j1: 1 }).pontos.j1).toBe(3);
  });

  it('deve perder 2 pontos quando declarou 0 e fez 2', () => {
    expect(calcular({ j1: 0 }, { j1: 2 }).pontos.j1).toBe(3);
  });

  it('deve perder 3 pontos quando declarou 5 e fez 2', () => {
    expect(calcular({ j1: 5 }, { j1: 2 }).pontos.j1).toBe(2);
  });

  it('deve permitir pontos negativos', () => {
    expect(calcular({ j1: 5 }, { j1: 0 }, 1).pontos.j1).toBe(-4);
  });
});
