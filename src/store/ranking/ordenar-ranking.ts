/**
 * Cálculo de métricas derivadas e ordenação do Ranking.
 *
 * Win rate = Vitórias / Partidas em que o participante apareceu (percentual
 * inteiro). Pos. média = somaPosicoes / Partidas (mantida bruta; a casa decimal
 * é formatada na renderização). A ordenação já nasce com o desempate canônico
 * completo — métrica ativa → Vitórias desc → win rate desc → pos. média asc →
 * humano acima dos Perfis de Bot — embora esta fatia só renderize por Vitórias.
 */

import type { ParticipanteRanking } from './tipos';

export type MetricaRanking = 'vitorias' | 'winRate' | 'posMedia';

export interface ParticipanteRankeado extends ParticipanteRanking {
  winRate: number;
  posMedia: number;
}

export function ordenarRanking(participantes: ParticipanteRanking[], metrica: MetricaRanking): ParticipanteRankeado[] {
  return participantes.map(comMetricas).sort((a, b) => comparar(a, b, metrica));
}

function comMetricas(p: ParticipanteRanking): ParticipanteRankeado {
  if (p.partidas === 0) return { ...p, winRate: 0, posMedia: 0 };
  return { ...p, winRate: Math.round((p.vitorias / p.partidas) * 100), posMedia: p.somaPosicoes / p.partidas };
}

function comparar(a: ParticipanteRankeado, b: ParticipanteRankeado, metrica: MetricaRanking): number {
  return porMetrica(a, b, metrica) || desempateCanonico(a, b);
}

function porMetrica(a: ParticipanteRankeado, b: ParticipanteRankeado, metrica: MetricaRanking): number {
  if (metrica === 'posMedia') return a.posMedia - b.posMedia;
  if (metrica === 'winRate') return b.winRate - a.winRate;
  return b.vitorias - a.vitorias;
}

function desempateCanonico(a: ParticipanteRankeado, b: ParticipanteRankeado): number {
  return (
    b.vitorias - a.vitorias ||
    b.winRate - a.winRate ||
    a.posMedia - b.posMedia ||
    (b.humano ? 1 : 0) - (a.humano ? 1 : 0)
  );
}
