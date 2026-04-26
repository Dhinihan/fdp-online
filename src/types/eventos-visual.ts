import type { EventoBase } from './eventos-dominio';

export interface EfeitoCartaVirada extends EventoBase {
  tipo: 'EFEITO_CARTA_VIRADA';
  elementoId: string;
  duracaoMs: number;
}

export interface EfeitoSomTocado extends EventoBase {
  tipo: 'EFEITO_SOM_TOCADO';
  somId: string;
}

export interface CenaMudada extends EventoBase {
  tipo: 'CENA_MUDADA';
  de: string;
  para: string;
}
