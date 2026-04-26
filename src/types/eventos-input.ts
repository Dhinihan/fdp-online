import type { Posicao } from './entidades';
import type { EventoBase } from './eventos-dominio';

export interface ToqueCarta extends EventoBase {
  tipo: 'TOQUE_CARTA';
  cartaId: string;
  posicao: Posicao;
}

export interface ToqueBotao extends EventoBase {
  tipo: 'TOQUE_BOTAO';
  botaoId: string;
}

export interface ArrastoCarta extends EventoBase {
  tipo: 'ARRASTO_CARTA';
  cartaId: string;
  de: Posicao;
  para: Posicao;
}
