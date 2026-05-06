import type { Carta, Valor } from '@/core/Carta';
import type { Jogador } from './entidades';

export type FaseRodada =
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

export interface EstadoRodada {
  fase: FaseRodada;
  jogadorAtual: number;
  mesa: MesaItem[];
  maos: MaoJogador[];
  vazas: Record<string, number>;
  turno: number;
  cartasPorRodada: number;
  manilha: Valor;
  cartaVirada: Carta | null;
}
