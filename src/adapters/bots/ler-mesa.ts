import { avaliarCartas, type CartaAvaliada } from '@/core/avaliador-carta';
import type { Carta } from '@/core/Carta';
import { calcularIndiceVencedor, cartasEmpatam, cartaVence } from '@/core/comparador-carta';
import type { EstadoEmJogo, MesaItem } from '@/types/estado-rodada';
import {
  calcularJogadoresPorAgir,
  calcularNecessidade,
  jogadoresInteressadosPorAgir,
  liderQuerVaza as mesaLiderQuerVaza,
  urgenciaAlta,
} from './contexto-posicao-mesa';
import { cartaPerde } from './decidirUltimoLinhaQuente';

export interface LeituraDaMesa {
  jogadorId: string;
  necessidade: number;
  folga: number;
  urgencia: number;
  urgenciaAlta: boolean;
  avaliadas: CartaAvaliada[];
  vencedoras: CartaAvaliada[];
  perdedoras: CartaAvaliada[];
  empates: CartaAvaliada[];
  lider: CartaAvaliada | null;
  jogadoresPorAgir: number;
  interessadosPorAgir: string[];
  liderQuerVaza: boolean;
  temAlvo: boolean;
}

export function cartasQueNaoFazemVaza(leitura: LeituraDaMesa): CartaAvaliada[] {
  return [...leitura.perdedoras, ...leitura.empates];
}

export function lerMesa(estado: EstadoEmJogo, mao: Carta[]): LeituraDaMesa {
  const jogadorId = estado.maos[estado.jogadorAtual].jogador.id;
  const necessidade = calcularNecessidade(estado, jogadorId);
  const { avaliadas, lider } = avaliarMaoELider(estado, mao);
  const classificacao = classificarCartas(avaliadas, lider, estado.manilha);

  return {
    jogadorId,
    necessidade,
    folga: mao.length - necessidade,
    urgencia: mao.length > 0 ? necessidade / mao.length : 0,
    urgenciaAlta: urgenciaAlta(necessidade, mao.length),
    avaliadas,
    ...classificacao,
    lider,
    jogadoresPorAgir: calcularJogadoresPorAgir(estado),
    interessadosPorAgir: jogadoresInteressadosPorAgir(estado),
    liderQuerVaza: mesaLiderQuerVaza(estado),
    temAlvo: existeAlvoNaMesa(estado, jogadorId),
  };
}

function avaliarMaoELider(
  estado: EstadoEmJogo,
  mao: Carta[],
): { avaliadas: CartaAvaliada[]; lider: CartaAvaliada | null } {
  const cartaLider = melhorCartaMesa(estado.mesa, estado.manilha);
  const cartasAvaliar = cartaLider ? [...mao, cartaLider] : mao;
  const todasAvaliadas = avaliarCartas(cartasAvaliar, estado.manilha, estado.cartasReveladas, estado.maos.length);
  return {
    avaliadas: cartaLider ? todasAvaliadas.slice(0, mao.length) : todasAvaliadas,
    lider: cartaLider ? todasAvaliadas[mao.length] : null,
  };
}

function classificarCartas(avaliadas: CartaAvaliada[], lider: CartaAvaliada | null, manilha: Carta['valor']) {
  if (!lider) {
    return { vencedoras: [...avaliadas], perdedoras: [] as CartaAvaliada[], empates: [] as CartaAvaliada[] };
  }
  return {
    vencedoras: avaliadas.filter((a) => cartaVence(a.carta, lider.carta, manilha)),
    perdedoras: avaliadas.filter((a) => cartaPerde(a.carta, lider.carta, manilha)),
    empates: avaliadas.filter((a) => cartasEmpatam(a.carta, lider.carta, manilha)),
  };
}

function existeAlvoNaMesa(estado: EstadoEmJogo, jogadorId: string): boolean {
  return Object.keys(estado.declaracoes).some((id) => id !== jogadorId && calcularNecessidade(estado, id) > 0);
}

function melhorCartaMesa(mesa: MesaItem[], manilha: Carta['valor']): Carta | null {
  if (mesa.length === 0) return null;
  return mesa[calcularIndiceVencedor(mesa, manilha)].carta;
}
