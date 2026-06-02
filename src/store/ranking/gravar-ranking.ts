/**
 * Boundary de escrita do Ranking. Lê o snapshot atual (corrompido → começa do
 * zero), registra a Partida concluída acumulando somatórios brutos e persiste
 * de volta na chave `fdp.ranking.v1`. Disparada quando `JOGO_ENCERRADO` é
 * processado — fora do Phaser, com `Storage` injetado para ser testável.
 *
 * O Ranking é um side effect secundário: qualquer falha de `Storage` (quota,
 * modo privado, `SecurityError`) é absorvida aqui para nunca interromper o
 * encerramento da Partida nem a tela de fim de jogo.
 */

import type { Jogador } from '@/types/entidades';
import { lerSnapshot } from './carregar-ranking';
import { registrarPartida } from './registrar-partida';
import { CHAVE_RANKING } from './tipos';

export function registrarPartidaNoArmazenamento(
  armazenamento: Pick<Storage, 'getItem' | 'setItem'>,
  classificacao: Jogador[],
): void {
  try {
    const atualizado = registrarPartida(lerSnapshot(armazenamento), classificacao);
    armazenamento.setItem(CHAVE_RANKING, JSON.stringify(atualizado));
  } catch (erro) {
    // eslint-disable-next-line no-console -- sinaliza a falha sem interromper o encerramento da Partida
    console.warn('Não foi possível persistir o Ranking; encerramento da Partida segue normalmente.', erro);
  }
}
