/**
 * Boundary de escrita da Sequência de Vitórias. Disparada no `onJogoEncerrado`
 * (`jogo-controller.ts`), junto do registro do Ranking, mas como boundary
 * independente em chave separada (`fdp.trofeus.v1`).
 *
 * Lê o snapshot atual (corrompido → estado zero), deriva se o humano venceu da
 * Classificação da Partida (índice 0 = vencedor) — único ponto que consulta a
 * Classificação para decidir vitória —, aplica a transição, persiste e
 * **retorna** o que a tela de fim de jogo deve exibir.
 *
 * O resultado já encapsula "há algo a exibir": é `null` tanto na derrota quanto
 * em falha de `Storage`, então o renderer só consome o resultado e nunca
 * reinspeciona a Classificação. A feature é um side effect secundário: qualquer
 * falha de `Storage` é absorvida — incluindo o próprio getter
 * `window.localStorage`, que pode lançar `SecurityError` — para nunca
 * interromper o encerramento da Partida.
 */

import type { Jogador } from '@/types/entidades';
import { lerSnapshot } from './carregar-trofeus';
import { CHAVE_TROFEUS, type ResultadoTrofeus } from './tipos';
import { aplicarTransicao } from './transicao-trofeus';

type ProvedorArmazenamento = () => Pick<Storage, 'getItem' | 'setItem'>;

export function registrarTrofeusNoArmazenamento(
  obterArmazenamento: ProvedorArmazenamento,
  classificacao: Jogador[],
): ResultadoTrofeus | null {
  try {
    const armazenamento = obterArmazenamento();
    const { snapshot, resultado } = aplicarTransicao(lerSnapshot(armazenamento), humanoVenceu(classificacao));
    armazenamento.setItem(CHAVE_TROFEUS, JSON.stringify(snapshot));
    return resultado;
  } catch (erro) {
    // eslint-disable-next-line no-console -- sinaliza a falha sem interromper o encerramento da Partida
    console.warn(
      'Não foi possível persistir a Sequência de Vitórias; encerramento da Partida segue normalmente.',
      erro,
    );
    return null;
  }
}

function humanoVenceu(classificacao: Jogador[]): boolean {
  return classificacao[0]?.id === 'humano';
}
