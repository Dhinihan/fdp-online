/**
 * Transição pura da Sequência de Vitórias e dos Troféus ao encerrar uma Partida.
 *
 * Recebe o snapshot atual e se o humano venceu; devolve o snapshot atualizado e
 * o resultado para a tela de fim de jogo. Venceu → sequência + 1, possivelmente
 * desbloqueando um Troféu; não venceu → zera a sequência (mas preserva o
 * `maiorTrofeu`, pois Troféus são permanentes) e resultado `null`.
 *
 * Regra de desbloqueio: só ocorre quando a nova `sequenciaAtual` cruza o limiar
 * do nível imediatamente acima do `maiorTrofeu`. Como a sequência sobe de 1 em
 * 1 e o `maiorTrofeu` avança no máximo um nível, desbloqueia-se no máximo um
 * Troféu por Partida e marcos já conquistados nunca recelebram. Nunca muta a
 * entrada.
 */

import { limiarDe, proximoNivel } from './tabela-trofeus';
import type { ResultadoTrofeus, SnapshotTrofeus } from './tipos';

export function aplicarTransicao(
  snapshot: SnapshotTrofeus,
  venceu: boolean,
): { snapshot: SnapshotTrofeus; resultado: ResultadoTrofeus | null } {
  if (!venceu) {
    return {
      snapshot: { versao: 1, sequenciaAtual: 0, maiorTrofeu: snapshot.maiorTrofeu },
      resultado: null,
    };
  }
  const sequenciaAtual = snapshot.sequenciaAtual + 1;
  const candidato = proximoNivel(snapshot.maiorTrofeu);
  const trofeuDesbloqueado = candidato !== null && sequenciaAtual >= limiarDe(candidato) ? candidato : null;
  const maiorTrofeu = trofeuDesbloqueado ?? snapshot.maiorTrofeu;
  return {
    snapshot: { versao: 1, sequenciaAtual, maiorTrofeu },
    resultado: { sequenciaAtual, trofeuDesbloqueado },
  };
}
