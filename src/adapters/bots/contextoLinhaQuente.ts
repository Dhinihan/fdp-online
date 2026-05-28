import { avaliarCartas, type CartaAvaliada } from '@/core/avaliador-carta';
import type { Carta } from '@/core/Carta';
import { calcularIndiceVencedor, cartasEmpatam, cartaVence } from '@/core/comparador-carta';
import type { EstadoEmJogo, MesaItem } from '@/types/estado-rodada';
import { calcularNecessidade } from './contexto-posicao-mesa';
import { cartaPerde } from './decidirUltimoLinhaQuente';

export { calcularNecessidade, ehUltimoDaMesa, liderQuerVaza } from './contexto-posicao-mesa';

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

function avaliarLider(estado: EstadoEmJogo): CartaAvaliada | null {
  const carta = melhorCartaMesa(estado.mesa, estado.manilha);
  if (!carta) return null;
  return avaliarCartas([carta], estado.manilha, estado.cartasReveladas, estado.maos.length)[0];
}

function melhorCartaMesa(mesa: MesaItem[], manilha: Carta['valor']): Carta | null {
  if (mesa.length === 0) return null;
  return mesa[calcularIndiceVencedor(mesa, manilha)].carta;
}
