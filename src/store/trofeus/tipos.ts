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
 * O que a tela de fim de jogo precisa saber sobre a sequência após o
 * encerramento. `null` é o resultado neutro (falha de Storage): a sequência
 * não é exibida.
 */
export interface ResultadoTrofeus {
  sequenciaAtual: number;
}
