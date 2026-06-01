/**
 * Identidade de Ranking de um participante a partir de um jogador da
 * Classificação da Partida. O jogador humano colapsa na chave `humano`; cada
 * Perfil de Bot vira um slug ASCII estável derivado do nome reconhecível
 * (`Brás` → `bot:bras`), independente do assento técnico (`bot1/bot2/bot3`).
 */

import type { Jogador } from '@/types/entidades';

export interface IdentidadeRanking {
  chave: string;
  nomeExibicao: string;
}

export function identidadeDe(jogador: Jogador): IdentidadeRanking {
  if (jogador.id === 'humano') return { chave: 'humano', nomeExibicao: jogador.nome };
  return { chave: `bot:${slug(jogador.nome)}`, nomeExibicao: jogador.nome };
}

function slug(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}
