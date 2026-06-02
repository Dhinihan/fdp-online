/**
 * Identidade de Ranking de um participante a partir de um jogador da
 * Classificação da Partida. O jogador humano colapsa na chave `humano`; cada
 * Perfil de Bot ancora na sua identidade canônica (`jogador.perfilId`,
 * ex.: `bras` → `bot:bras`), estável entre Partidas e independente tanto do
 * assento técnico (`bot1/bot2/bot3`) quanto do nome exibido.
 *
 * O contrato é explícito: ou o participante carrega `perfilId` (é um Perfil de
 * Bot), ou é o humano. Um participante sem identidade reconhecível não é
 * silenciosamente tratado como bot — é um erro.
 */

import type { Jogador } from '@/types/entidades';

export interface IdentidadeRanking {
  chave: string;
  nomeExibicao: string;
}

export function identidadeDe(jogador: Jogador): IdentidadeRanking {
  if (jogador.perfilId !== undefined) {
    return { chave: `bot:${jogador.perfilId}`, nomeExibicao: jogador.nome };
  }
  if (jogador.id === 'humano') {
    return { chave: 'humano', nomeExibicao: jogador.nome };
  }
  throw new Error(`Participante sem identidade de Ranking reconhecível: ${jogador.id}`);
}
