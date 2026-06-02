export type { Carta, Naipe, Valor } from '@/core/Carta';

export interface Jogador {
  id: string;
  nome: string;
  pontos: number;
  /**
   * Identidade canônica do Perfil de Bot (estável entre Partidas, independente
   * do assento técnico e do nome exibido). Ausente para o jogador humano.
   */
  perfilId?: string;
  temperatura?: number;
  avatar?: string;
}

export interface Posicao {
  x: number;
  y: number;
}
