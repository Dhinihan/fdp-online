/**
 * Contrato persistido da Sequência de Vitórias e Troféus (chave
 * `fdp.trofeus.v1`), separado do Ranking. Feature exclusiva do jogador humano.
 *
 * Nesta entrega guardamos só a `sequenciaAtual`; `maiorTrofeu` já existe na
 * forma mas é sempre `null` — os níveis de Troféu entram na próxima slice.
 */

export const CHAVE_TROFEUS = 'fdp.trofeus.v1';

export interface SnapshotTrofeus {
  versao: 1;
  sequenciaAtual: number;
  maiorTrofeu: null;
}

export const SNAPSHOT_ZERO: SnapshotTrofeus = { versao: 1, sequenciaAtual: 0, maiorTrofeu: null };

/**
 * O que a tela de fim de jogo exibe sobre a sequência após o encerramento. Sua
 * presença já significa "há algo a exibir": só existe quando o humano venceu. O
 * resultado neutro — derrota ou falha de Storage — é representado por `null`, e
 * o renderer nunca precisa reinspecionar a Classificação da Partida.
 */
export interface ResultadoTrofeus {
  sequenciaAtual: number;
}
