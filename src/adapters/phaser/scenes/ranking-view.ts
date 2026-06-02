import { ordenarRanking, type MetricaRanking, type ParticipanteRankeado } from '@/store/ranking/ordenar-ranking';
import type { ParticipanteRanking } from '@/store/ranking/tipos';

export const OPCOES_METRICA_RANKING: { chave: MetricaRanking; rotulo: string; rotuloCurto: string }[] = [
  { chave: 'vitorias', rotulo: 'Vitórias', rotuloCurto: 'vitórias' },
  { chave: 'winRate', rotulo: 'Win rate', rotuloCurto: 'win rate' },
  { chave: 'posMedia', rotulo: 'Pos. média', rotuloCurto: 'pos. média' },
];

export interface RankingRenderModel {
  metrica: MetricaRanking;
  participantes: ParticipanteRankeado[];
}

export function prepararRankingRenderModel(
  participantes: ParticipanteRanking[],
  metrica: MetricaRanking,
): RankingRenderModel {
  return { metrica, participantes: ordenarRanking(participantes, metrica) };
}

export function formatarMetricaRanking(item: ParticipanteRankeado, metrica: MetricaRanking): string {
  if (metrica === 'winRate') return `${String(item.winRate)}%`;
  if (metrica === 'posMedia') return item.posMedia.toFixed(1);
  return String(item.vitorias);
}

export function rotuloCurtoMetricaRanking(metrica: MetricaRanking): string {
  return OPCOES_METRICA_RANKING.find((opcao) => opcao.chave === metrica)?.rotuloCurto ?? '';
}
