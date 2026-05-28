import type { CartaAvaliada } from '@/core/avaliador-carta';
import type { Carta } from '@/core/Carta';
import { cartasEmpatam, cartaVence } from '@/core/comparador-carta';
import type { EstadoEmJogo } from '@/types/estado-rodada';
import { liderQuerVaza } from './contexto-posicao-mesa';
import { cartaMaisForte, descartePorNecessidade, escolherVencedoraPorNecessidade } from './escolhas-por-necessidade';
import { MOTIVOS_FUGA_FECHA, escolherFugaJaCumpriu } from './escolher-fuga-ja-cumpriu';
import { ehAltaOuMelhor } from './predicados-carta-avaliada';

export interface ContextoUltimoLinhaQuente {
  necessidade: number;
  avaliadas: CartaAvaliada[];
  vencedoras: CartaAvaliada[];
  perdedoras: CartaAvaliada[];
  empates: CartaAvaliada[];
  lider: CartaAvaliada | null;
}

export interface DecisaoUltimoLinhaQuente {
  carta: Carta;
  motivo: string;
}

export function decidirUltimoLinhaQuente(
  estado: EstadoEmJogo,
  contexto: ContextoUltimoLinhaQuente,
): DecisaoUltimoLinhaQuente {
  if (contexto.necessidade > 0) return decidirQuandoPrecisaFazer(estado, contexto);
  return decidirQuandoJaCumpriu(estado, contexto);
}

export function cartaPerde(carta: Carta, lider: Carta, manilha: Carta['valor']): boolean {
  return !cartaVence(carta, lider, manilha) && !cartasEmpatam(carta, lider, manilha);
}

function decidirQuandoPrecisaFazer(
  estado: EstadoEmJogo,
  contexto: ContextoUltimoLinhaQuente,
): DecisaoUltimoLinhaQuente {
  if (contexto.vencedoras.length === 0) {
    return {
      carta: descartePorNecessidade(cartasQueNaoVencem(contexto), estado.manilha, contexto.necessidade).carta,
      motivo: 'precisa fazer, sem carta que vence; P[N-X]',
    };
  }
  if (deveFazerAgora(estado, contexto)) {
    return {
      carta: escolherVencedoraPorNecessidade(contexto.vencedoras, estado.manilha, contexto.necessidade).carta,
      motivo: 'precisa fazer; regra G[N-X]',
    };
  }
  if (contexto.perdedoras.length > 0) {
    return {
      carta: descartePorNecessidade(contexto.perdedoras, estado.manilha, contexto.necessidade).carta,
      motivo: 'precisa fazer; adiou; P[N-X]',
    };
  }
  return {
    carta: escolherVencedoraPorNecessidade(contexto.vencedoras, estado.manilha, contexto.necessidade).carta,
    motivo: 'precisa fazer; regra G[N-X]',
  };
}

function decidirQuandoJaCumpriu(estado: EstadoEmJogo, contexto: ContextoUltimoLinhaQuente): DecisaoUltimoLinhaQuente {
  const opcoes = {
    liderInteressado: liderQuerVaza(estado),
    fallbackSemFuga: 'mais-forte-mao' as const,
    motivos: MOTIVOS_FUGA_FECHA,
  };
  const decisao = escolherFugaJaCumpriu(estado, contexto, opcoes);
  if (decisao) return decisao;
  return {
    carta: cartaMaisForte(contexto.avaliadas, estado.manilha).carta,
    motivo: MOTIVOS_FUGA_FECHA.fugaImpossivel,
  };
}

function deveFazerAgora(estado: EstadoEmJogo, contexto: ContextoUltimoLinhaQuente): boolean {
  if (!contexto.lider) return true;
  if (liderQuerVaza(estado) && ehAltaOuMelhor(contexto.lider)) return true;
  return contexto.necessidade / contexto.avaliadas.length >= 0.66;
}

function cartasQueNaoVencem(contexto: ContextoUltimoLinhaQuente): CartaAvaliada[] {
  return [...contexto.perdedoras, ...contexto.empates];
}
