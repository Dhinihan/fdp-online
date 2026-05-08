import type { Carta, Valor } from '@/core/Carta';
import type { Jogador } from './entidades';

export type FaseComCartas =
  | 'aguardandoDeclaracao'
  | 'processandoDeclaracao'
  | 'aguardandoJogada'
  | 'processandoTurno'
  | 'rodadaConcluida';

export type FaseRodada = 'distribuindo' | FaseComCartas;

export interface MaoJogador {
  jogador: Jogador;
  cartas: Carta[];
  visivel: boolean;
}

export interface MesaItem {
  jogadorId: string;
  carta: Carta;
}

export interface EstadoDistribuindo {
  fase: 'distribuindo';
  jogadorAtual: number;
  pontos: Record<string, number>;
}

interface EstadoComCartasBase {
  jogadorAtual: number;
  pontos: Record<string, number>;
  maos: MaoJogador[];
  cartasPorRodada: number;
  manilha: Valor;
  cartaVirada: Carta | null;
  declaracoes: Record<string, number>;
  mesa: MesaItem[];
  vazas: Record<string, number>;
  turno: number;
}

export type EstadoAguardandoDeclaracao = EstadoComCartasBase & { fase: 'aguardandoDeclaracao' };
export type EstadoProcessandoDeclaracao = EstadoComCartasBase & { fase: 'processandoDeclaracao' };
export type EstadoAguardandoJogada = EstadoComCartasBase & { fase: 'aguardandoJogada' };
export type EstadoProcessandoTurno = EstadoComCartasBase & { fase: 'processandoTurno' };
export type EstadoRodadaConcluida = EstadoComCartasBase & { fase: 'rodadaConcluida' };

export type EstadoEmJogo =
  | EstadoAguardandoDeclaracao
  | EstadoProcessandoDeclaracao
  | EstadoAguardandoJogada
  | EstadoProcessandoTurno
  | EstadoRodadaConcluida;

export type EstadoRodada = EstadoDistribuindo | EstadoEmJogo;

export interface EstadoMutavel extends Omit<EstadoComCartasBase, 'fase'> {
  fase: FaseRodada;
}

export function estadoEmJogo(estado: EstadoRodada): EstadoEmJogo {
  if (estado.fase === 'distribuindo') {
    throw new Error('Estado não deveria estar em distribuindo');
  }
  return estado;
}
