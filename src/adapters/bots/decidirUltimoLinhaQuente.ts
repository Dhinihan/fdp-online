import type { CartaAvaliada } from '@/core/avaliador-carta';
import type { Carta } from '@/core/Carta';
import { calcularIndiceVencedor, cartasEmpatam, cartaVence, compararForcaReal } from '@/core/comparador-carta';
import type { EstadoEmJogo } from '@/types/estado-rodada';

export interface ContextoUltimoLinhaQuente {
  necessidade: number;
  avaliadas: CartaAvaliada[];
  vencedoras: CartaAvaliada[];
  perdedoras: CartaAvaliada[];
  empates: CartaAvaliada[];
  lider: CartaAvaliada | null;
}

export function decidirUltimoLinhaQuente(estado: EstadoEmJogo, contexto: ContextoUltimoLinhaQuente): Carta {
  if (contexto.necessidade > 0) return decidirQuandoPrecisaFazer(estado, contexto);
  return decidirQuandoJaCumpriu(estado, contexto);
}

export function cartaPerde(carta: Carta, lider: Carta, manilha: Carta['valor']): boolean {
  return !cartaVence(carta, lider, manilha) && !cartasEmpatam(carta, lider, manilha);
}

function decidirQuandoPrecisaFazer(estado: EstadoEmJogo, contexto: ContextoUltimoLinhaQuente): Carta {
  if (contexto.vencedoras.length === 0) {
    return escolherPerdedora(cartasQueNaoVencem(contexto), estado.manilha, contexto).carta;
  }
  if (deveFazerAgora(estado, contexto)) return escolherGanhadora(contexto.vencedoras, estado.manilha, contexto).carta;
  if (contexto.perdedoras.length > 0) return cartaMaisForte(contexto.perdedoras, estado.manilha).carta;
  return escolherGanhadora(contexto.vencedoras, estado.manilha, contexto).carta;
}

function decidirQuandoJaCumpriu(estado: EstadoEmJogo, contexto: ContextoUltimoLinhaQuente): Carta {
  if (liderQuerVaza(estado)) return fugirContraLiderQuePrecisa(estado, contexto).carta;
  if (contexto.perdedoras.length > 0) return cartaMaisForte(contexto.perdedoras, estado.manilha).carta;
  if (contexto.empates.length > 0) return cartaMaisForte(contexto.empates, estado.manilha).carta;
  return cartaMaisForte(contexto.avaliadas, estado.manilha).carta;
}

function fugirContraLiderQuePrecisa(estado: EstadoEmJogo, contexto: ContextoUltimoLinhaQuente): CartaAvaliada {
  if (contexto.lider && ehAltaOuMelhor(contexto.lider) && contexto.empates.length > 0) {
    return cartaMaisForte(contexto.empates, estado.manilha);
  }
  if (contexto.perdedoras.length > 0) return cartaMaisForte(contexto.perdedoras, estado.manilha);
  if (contexto.empates.length > 0) return cartaMaisForte(contexto.empates, estado.manilha);
  return cartaMaisForte(contexto.avaliadas, estado.manilha);
}

function deveFazerAgora(estado: EstadoEmJogo, contexto: ContextoUltimoLinhaQuente): boolean {
  if (!contexto.lider) return true;
  if (liderQuerVaza(estado) && ehAltaOuMelhor(contexto.lider)) return true;
  return contexto.necessidade / contexto.avaliadas.length >= 0.66;
}

function escolherGanhadora(
  avaliadas: CartaAvaliada[],
  manilha: Carta['valor'],
  contexto: ContextoUltimoLinhaQuente,
): CartaAvaliada {
  const ordenadas = ordenarPorForcaReal(avaliadas, manilha);
  const indice = ordenadas.length >= contexto.necessidade ? ordenadas.length - contexto.necessidade : 0;
  return ordenadas[indice];
}

function escolherPerdedora(
  avaliadas: CartaAvaliada[],
  manilha: Carta['valor'],
  contexto: ContextoUltimoLinhaQuente,
): CartaAvaliada {
  const ordenadas = ordenarPorForcaReal(avaliadas, manilha);
  const indice = ordenadas.length > contexto.necessidade ? ordenadas.length - contexto.necessidade : 0;
  return ordenadas[indice];
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

function ordenarPorForcaReal(avaliadas: CartaAvaliada[], manilha: Carta['valor']): CartaAvaliada[] {
  return [...avaliadas].sort((a, b) => compararForcaReal(a.carta, b.carta, manilha));
}

function cartaMaisForte(avaliadas: CartaAvaliada[], manilha: Carta['valor']): CartaAvaliada {
  const ordenadas = ordenarPorForcaReal(avaliadas, manilha);
  return ordenadas[ordenadas.length - 1];
}
