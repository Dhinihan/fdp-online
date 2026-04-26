import type { EventoBase } from './eventos-dominio';

export interface ToqueCarta extends EventoBase {
  tipo: 'TOQUE_CARTA';
  cartaId: string;
  posicao: { x: number; y: number };
}

export interface ToqueBotao extends EventoBase {
  tipo: 'TOQUE_BOTAO';
  botaoId: string;
}

export interface ArrastoCarta extends EventoBase {
  tipo: 'ARRASTO_CARTA';
  cartaId: string;
  de: { x: number; y: number };
  para: { x: number; y: number };
}
