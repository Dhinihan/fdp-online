/**
 * Transição pura da Sequência de Vitórias ao encerrar uma Partida.
 *
 * Recebe o snapshot atual e se o humano venceu; devolve o snapshot atualizado e
 * o resultado para a tela de fim de jogo. Venceu → sequência + 1; não venceu →
 * zera. Nunca muta a entrada. `maiorTrofeu` permanece nulo nesta slice.
 */

import type { ResultadoTrofeus, SnapshotTrofeus } from './tipos';

export function aplicarTransicao(
  snapshot: SnapshotTrofeus,
  venceu: boolean,
): { snapshot: SnapshotTrofeus; resultado: ResultadoTrofeus } {
  const sequenciaAtual = venceu ? snapshot.sequenciaAtual + 1 : 0;
  return {
    snapshot: { versao: 1, sequenciaAtual, maiorTrofeu: null },
    resultado: { sequenciaAtual },
  };
}
