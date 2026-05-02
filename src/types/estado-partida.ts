import type { Carta } from '@/core/Carta';
import type { Jogador } from './entidades';

export interface MaoJogador {
  jogador: Jogador;
  cartas: Carta[];
  visivel: boolean;
}
