/**
 * Registro puro de uma Partida concluída no snapshot do Ranking.
 *
 * A Classificação da Partida chega ordenada (posição = índice + 1, já com o
 * desempate do core). Para cada participante acumulamos somatórios brutos:
 * uma partida a mais, a Vitória de Partida só do primeiro colocado, e a soma
 * das posições ordinais (eliminados inclusos). Nunca muta a entrada.
 */

import type { Jogador } from '@/types/entidades';
import { identidadeDe } from './identidade';
import type { ParticipantePersistido, SnapshotRanking } from './tipos';

export function registrarPartida(snapshot: SnapshotRanking, classificacao: Jogador[]): SnapshotRanking {
  const participantes = { ...snapshot.participantes };
  classificacao.forEach((jogador, indice) => {
    const { chave, nomeExibicao } = identidadeDe(jogador);
    participantes[chave] = acumular(participantes[chave], nomeExibicao, indice + 1);
  });
  return { versao: 1, participantes };
}

function acumular(
  anterior: ParticipantePersistido | undefined,
  nomeExibicao: string,
  posicao: number,
): ParticipantePersistido {
  const base = anterior ?? { nomeExibicao, partidas: 0, vitorias: 0, somaPosicoes: 0 };
  return {
    nomeExibicao,
    partidas: base.partidas + 1,
    vitorias: base.vitorias + (posicao === 1 ? 1 : 0),
    somaPosicoes: base.somaPosicoes + posicao,
  };
}
