import type { CartaAvaliada } from '@/core/avaliador-carta';
import type { Carta } from '@/core/Carta';
import type { EstadoEmJogo } from '@/types/estado-rodada';
import { cartaMaisForte } from './escolhas-por-necessidade';
import { ehAltaOuMelhor } from './predicados-carta-avaliada';

export interface ContextoFugaJaCumpriu {
  perdedoras: CartaAvaliada[];
  empates: CartaAvaliada[];
  lider: CartaAvaliada | null;
  avaliadas: CartaAvaliada[];
}

export interface DecisaoFugaJaCumpriu {
  carta: Carta;
  motivo: string;
}

export interface MotivosFugaJaCumpriu {
  empateContraLiderAlta: string;
  perdedoraMaisForte: string;
  empateMaisForte: string;
  fugaImpossivel: string;
}

export const MOTIVOS_FUGA_MEIO: MotivosFugaJaCumpriu = {
  empateContraLiderAlta: 'já cumpriu; empate contra líder alta+',
  perdedoraMaisForte: 'já cumpriu; perdedora mais forte',
  empateMaisForte: 'já cumpriu; empate mais forte',
  fugaImpossivel: 'já cumpriu; fuga impossível',
};

export const MOTIVOS_FUGA_FECHA: MotivosFugaJaCumpriu = {
  empateContraLiderAlta: 'já cumpriu; fuga contra líder alta+',
  perdedoraMaisForte: 'já cumpriu; carta mais alta que não faz',
  empateMaisForte: 'já cumpriu; carta mais alta que não faz',
  fugaImpossivel: 'já cumpriu; fuga impossível',
};

interface OpcoesEscolherFugaJaCumpriu {
  liderInteressado: boolean;
  fallbackSemFuga: 'null' | 'mais-forte-mao';
  motivos: MotivosFugaJaCumpriu;
}

export function escolherFugaJaCumpriu(
  estado: EstadoEmJogo,
  contexto: ContextoFugaJaCumpriu,
  opcoes: OpcoesEscolherFugaJaCumpriu,
): DecisaoFugaJaCumpriu | null {
  const { motivos, liderInteressado, fallbackSemFuga } = opcoes;
  const manilha = estado.manilha;

  if (liderInteressado && contexto.lider && ehAltaOuMelhor(contexto.lider) && contexto.empates.length > 0) {
    return criarDecisao(cartaMaisForte(contexto.empates, manilha), motivos.empateContraLiderAlta);
  }
  if (contexto.perdedoras.length > 0) {
    return criarDecisao(cartaMaisForte(contexto.perdedoras, manilha), motivos.perdedoraMaisForte);
  }
  if (contexto.empates.length > 0) {
    return criarDecisao(cartaMaisForte(contexto.empates, manilha), motivos.empateMaisForte);
  }
  if (fallbackSemFuga === 'mais-forte-mao') {
    return criarDecisao(cartaMaisForte(contexto.avaliadas, manilha), motivos.fugaImpossivel);
  }
  return null;
}

function criarDecisao(avaliada: CartaAvaliada, motivo: string): DecisaoFugaJaCumpriu {
  return { carta: avaliada.carta, motivo };
}
