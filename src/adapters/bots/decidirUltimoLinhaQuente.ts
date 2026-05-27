import type { CartaAvaliada } from '@/core/avaliador-carta';
import type { Carta } from '@/core/Carta';
import { calcularIndiceVencedor, cartasEmpatam, cartaVence } from '@/core/comparador-carta';
import type { EstadoEmJogo } from '@/types/estado-rodada';
import {
  descartePorNecessidade,
  escolherVencedoraPorNecessidade,
  ordenarPorForcaReal,
} from './escolhas-por-necessidade';

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
  if (liderQuerVaza(estado)) return fugirContraLiderQuePrecisa(estado, contexto);
  if (contexto.perdedoras.length > 0) {
    return {
      carta: cartaMaisForte(contexto.perdedoras, estado.manilha).carta,
      motivo: 'já cumpriu; carta mais alta que não faz',
    };
  }
  if (contexto.empates.length > 0) {
    return {
      carta: cartaMaisForte(contexto.empates, estado.manilha).carta,
      motivo: 'já cumpriu; carta mais alta que não faz',
    };
  }
  return {
    carta: cartaMaisForte(contexto.avaliadas, estado.manilha).carta,
    motivo: 'já cumpriu; fuga impossível',
  };
}

function fugirContraLiderQuePrecisa(
  estado: EstadoEmJogo,
  contexto: ContextoUltimoLinhaQuente,
): DecisaoUltimoLinhaQuente {
  if (contexto.lider && ehAltaOuMelhor(contexto.lider) && contexto.empates.length > 0) {
    return {
      carta: cartaMaisForte(contexto.empates, estado.manilha).carta,
      motivo: 'já cumpriu; fuga contra líder alta+',
    };
  }
  if (contexto.perdedoras.length > 0) {
    return {
      carta: cartaMaisForte(contexto.perdedoras, estado.manilha).carta,
      motivo: 'já cumpriu; carta mais alta que não faz',
    };
  }
  if (contexto.empates.length > 0) {
    return {
      carta: cartaMaisForte(contexto.empates, estado.manilha).carta,
      motivo: 'já cumpriu; carta mais alta que não faz',
    };
  }
  return {
    carta: cartaMaisForte(contexto.avaliadas, estado.manilha).carta,
    motivo: 'já cumpriu; fuga impossível',
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

function liderQuerVaza(estado: EstadoEmJogo): boolean {
  const lider = estado.mesa[calcularIndiceVencedor(estado.mesa, estado.manilha)];
  const necessidade = (estado.declaracoes[lider.jogadorId] ?? 0) - (estado.vazas[lider.jogadorId] ?? 0);
  return necessidade > 0;
}

function ehAltaOuMelhor(avaliada: CartaAvaliada): boolean {
  return ['alta', 'segura', 'garantida_agora'].includes(avaliada.categoria);
}

function cartaMaisForte(avaliadas: CartaAvaliada[], manilha: Carta['valor']): CartaAvaliada {
  const ordenadas = ordenarPorForcaReal(avaliadas, manilha);
  return ordenadas[ordenadas.length - 1];
}
