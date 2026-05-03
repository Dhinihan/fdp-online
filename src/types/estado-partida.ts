import type { Carta } from '@/core/Carta';
import type { Jogador } from './entidades';

export type FasePartida = 'distribuindo' | 'aguardandoJogada' | 'processandoTurno' | 'turnoConcluido';

export interface MaoJogador {
  jogador: Jogador;
  cartas: Carta[];
  visivel: boolean;
}

export interface EstadoPartida {
  fase: FasePartida;
  jogadorAtual: number;
  mesa: Carta[];
  maos: MaoJogador[];
}
