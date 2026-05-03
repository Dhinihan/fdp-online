import type { Carta } from '@/core/Carta';
import type { Jogador } from './entidades';

export type FasePartida = 'aguardandoJogada';

export interface MaoJogador {
  jogador: Jogador;
  cartas: Carta[];
  visivel: boolean;
}

export interface EstadoPartida {
  fase: FasePartida;
  mesa: Carta[];
}
