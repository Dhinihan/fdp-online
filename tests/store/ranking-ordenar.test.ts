import { describe, expect, it } from 'vitest';
import { ordenarRanking, type MetricaRanking } from '@/store/ranking/ordenar-ranking';
import type { ParticipanteRanking } from '@/store/ranking/tipos';

function p(over: Partial<ParticipanteRanking> & { chave: string }): ParticipanteRanking {
  return { nomeExibicao: over.chave, humano: false, partidas: 10, vitorias: 0, somaPosicoes: 20, ...over };
}

function chaves(participantes: ParticipanteRanking[], metrica: MetricaRanking): string[] {
  return ordenarRanking(participantes, metrica).map((x) => x.chave);
}

describe('ordenarRanking — métricas derivadas', () => {
  it('calcula win rate como percentual inteiro e pos. média como razão', () => {
    const [r] = ordenarRanking([p({ chave: 'a', vitorias: 3, partidas: 8, somaPosicoes: 18 })], 'vitorias');

    expect(r.winRate).toBe(38); // round(3/8*100) = 37.5 → 38
    expect(r.posMedia).toBeCloseTo(2.25);
  });

  it('trata zero partidas sem dividir por zero', () => {
    const [r] = ordenarRanking([p({ chave: 'a', partidas: 0, vitorias: 0, somaPosicoes: 0 })], 'vitorias');

    expect(r.winRate).toBe(0);
    expect(r.posMedia).toBe(0);
  });
});

describe('ordenarRanking — ordenação por Vitórias com desempate canônico', () => {
  it('ordena por Vitórias decrescente', () => {
    const lista = [p({ chave: 'a', vitorias: 1 }), p({ chave: 'b', vitorias: 5 }), p({ chave: 'c', vitorias: 3 })];

    expect(chaves(lista, 'vitorias')).toEqual(['b', 'c', 'a']);
  });

  it('desempata Vitórias iguais por win rate decrescente', () => {
    const lista = [p({ chave: 'a', vitorias: 2, partidas: 10 }), p({ chave: 'b', vitorias: 2, partidas: 4 })];

    expect(chaves(lista, 'vitorias')).toEqual(['b', 'a']); // 20% vs 50%
  });

  it('desempata win rate igual por pos. média crescente', () => {
    const lista = [
      p({ chave: 'a', vitorias: 2, partidas: 4, somaPosicoes: 12 }), // posMedia 3.0
      p({ chave: 'b', vitorias: 2, partidas: 4, somaPosicoes: 8 }), //  posMedia 2.0
    ];

    expect(chaves(lista, 'vitorias')).toEqual(['b', 'a']);
  });

  it('com tudo igual, coloca o humano acima dos Perfis de Bot', () => {
    const base = { vitorias: 2, partidas: 4, somaPosicoes: 8 };
    const lista = [p({ chave: 'bot:bras', ...base }), p({ chave: 'humano', humano: true, ...base })];

    expect(chaves(lista, 'vitorias')).toEqual(['humano', 'bot:bras']);
  });
});

describe('ordenarRanking — outras métricas ativas', () => {
  it('ordena por pos. média crescente quando a métrica ativa é posMedia', () => {
    const lista = [
      p({ chave: 'a', vitorias: 0, partidas: 4, somaPosicoes: 12 }), // 3.0
      p({ chave: 'b', vitorias: 0, partidas: 4, somaPosicoes: 4 }), //  1.0
    ];

    expect(chaves(lista, 'posMedia')).toEqual(['b', 'a']);
  });

  it('ordena por win rate decrescente quando a métrica ativa é winRate', () => {
    const lista = [p({ chave: 'a', vitorias: 1, partidas: 10 }), p({ chave: 'b', vitorias: 3, partidas: 10 })];

    expect(chaves(lista, 'winRate')).toEqual(['b', 'a']); // 10% vs 30%
  });

  it('não muta a lista de entrada', () => {
    const entrada = [p({ chave: 'a', vitorias: 1 }), p({ chave: 'b', vitorias: 5 })];
    ordenarRanking(entrada, 'vitorias');

    expect(entrada.map((x) => x.chave)).toEqual(['a', 'b']);
  });
});
