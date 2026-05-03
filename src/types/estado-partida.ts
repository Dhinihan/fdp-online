import type { Carta } from '@/core/Carta';
import type { Jogador } from './entidades';

export type FasePartida =
  | 'distribuindo'
  | 'aguardandoJogada'
  | 'processandoTurno'
  | 'turnoConcluido'
  | 'rodadaConcluida';

export interface MaoJogador {
  jogador: Jogador;
  cartas: Carta[];
  visivel: boolean;
}

export interface MesaItem {
  jogadorId: string;
  carta: Carta;
}

export interface EstadoPartida {
  fase: FasePartida;
  jogadorAtual: number;
  mesa: MesaItem[];
  maos: MaoJogador[];
  vazas: Record<string, number>;
  turno: number;
  cartasPorRodada: number;
}
