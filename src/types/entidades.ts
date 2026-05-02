export type { Carta, Naipe, Valor } from '@/core/Carta';

export interface Jogador {
  id: string;
  nome: string;
  pontos: number;
  avatar?: string;
}

export interface Posicao {
  x: number;
  y: number;
}
