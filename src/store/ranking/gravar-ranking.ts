/**
 * Boundary de escrita do Ranking. Lê o snapshot atual (corrompido → começa do
 * zero), registra a Partida concluída acumulando somatórios brutos e persiste
 * de volta na chave `fdp.ranking.v1`. Disparada quando `JOGO_ENCERRADO` é
 * processado — fora do Phaser, com `Storage` injetado para ser testável.
 */

import type { Jogador } from '@/types/entidades';
import { lerSnapshot } from './carregar-ranking';
import { registrarPartida } from './registrar-partida';
import { CHAVE_RANKING } from './tipos';

export function registrarPartidaNoArmazenamento(
  armazenamento: Pick<Storage, 'getItem' | 'setItem'>,
  classificacao: Jogador[],
): void {
  const atualizado = registrarPartida(lerSnapshot(armazenamento), classificacao);
  armazenamento.setItem(CHAVE_RANKING, JSON.stringify(atualizado));
}
