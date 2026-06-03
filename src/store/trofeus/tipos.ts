/**
 * Contrato persistido da Sequência de Vitórias e Troféus (chave
 * `fdp.trofeus.v1`), separado do Ranking. Feature exclusiva do jogador humano.
 *
 * Guardamos a `sequenciaAtual` e o `maiorTrofeu` (o nível mais alto já
 * conquistado, ou `null`). O conjunto de Troféus conquistados é deduzido do
 * `maiorTrofeu` pelos níveis ordenados — não é persistido explicitamente.
 */

import type { Nivel } from './tabela-trofeus';

export const CHAVE_TROFEUS = 'fdp.trofeus.v1';

export interface SnapshotTrofeus {
  versao: 1;
  sequenciaAtual: number;
  maiorTrofeu: Nivel | null;
}

export const SNAPSHOT_ZERO: SnapshotTrofeus = { versao: 1, sequenciaAtual: 0, maiorTrofeu: null };

/**
 * O que a tela de fim de jogo exibe sobre a sequência após o encerramento. Sua
 * presença já significa "há algo a exibir": só existe quando o humano venceu. O
 * resultado neutro — derrota ou falha de Storage — é representado por `null`, e
 * o renderer nunca precisa reinspecionar a Classificação da Partida.
 *
 * `trofeuDesbloqueado` é o nível recém-conquistado nesta Partida, ou `null`
 * quando a vitória não cruzou nenhum marco novo (no máximo um por Partida).
 */
export interface ResultadoTrofeus {
  sequenciaAtual: number;
  trofeuDesbloqueado: Nivel | null;
}
