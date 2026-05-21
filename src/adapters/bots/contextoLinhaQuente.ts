import { avaliarCartas, type CartaAvaliada } from '@/core/avaliador-carta';
import type { Carta } from '@/core/Carta';
import { calcularIndiceVencedor, cartasEmpatam, cartaVence } from '@/core/comparador-carta';
import type { EstadoEmJogo, MesaItem } from '@/types/estado-rodada';
import { cartaPerde } from './decidirUltimoLinhaQuente';

export interface ContextoJogadaQuente {
  jogadorId: string;
  necessidade: number;
  folga: number;
  avaliadas: CartaAvaliada[];
  vencedoras: CartaAvaliada[];
  perdedoras: CartaAvaliada[];
  empates: CartaAvaliada[];
  lider: CartaAvaliada | null;
}

export function criarContextoLinhaQuente(estado: EstadoEmJogo, mao: Carta[]): ContextoJogadaQuente {
  const jogadorId = estado.maos[estado.jogadorAtual].jogador.id;
  const necessidade = calcularNecessidade(estado, jogadorId);
  const avaliadas = avaliarCartas(mao, estado.manilha, estado.cartasReveladas, estado.maos.length);
  const lider = avaliarLider(estado);
  return {
    jogadorId,
    necessidade,
    folga: mao.length - necessidade,
    avaliadas,
    vencedoras: lider ? avaliadas.filter((a) => cartaVence(a.carta, lider.carta, estado.manilha)) : [...avaliadas],
    perdedoras: lider ? avaliadas.filter((a) => cartaPerde(a.carta, lider.carta, estado.manilha)) : [],
    empates: lider ? avaliadas.filter((a) => cartasEmpatam(a.carta, lider.carta, estado.manilha)) : [],
    lider,
  };
}

export function liderQuerVaza(estado: EstadoEmJogo): boolean {
  if (estado.mesa.length === 0) return false;
  const lider = estado.mesa[calcularIndiceVencedor(estado.mesa, estado.manilha)];
  return calcularNecessidade(estado, lider.jogadorId) > 0;
}

export function calcularNecessidade(estado: EstadoEmJogo, jogadorId: string): number {
  return (estado.declaracoes[jogadorId] ?? 0) - (estado.vazas[jogadorId] ?? 0);
}

export function ehUltimoDaMesa(estado: EstadoEmJogo): boolean {
  return estado.mesa.length === estado.maos.length - 1;
}

function avaliarLider(estado: EstadoEmJogo): CartaAvaliada | null {
  const carta = melhorCartaMesa(estado.mesa, estado.manilha);
  if (!carta) return null;
  return avaliarCartas([carta], estado.manilha, estado.cartasReveladas, estado.maos.length)[0];
}

function melhorCartaMesa(mesa: MesaItem[], manilha: Carta['valor']): Carta | null {
  if (mesa.length === 0) return null;
  return mesa[calcularIndiceVencedor(mesa, manilha)].carta;
}
