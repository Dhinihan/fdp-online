import { criarBaralho } from './Baralho';
import { ehManilha, type Carta, type Naipe, type Valor } from './Carta';
import { cartaVence, cartasEmpatam } from './comparador-carta';

export type CategoriaCarta = 'baixa' | 'média' | 'alta' | 'segura' | 'garantida_agora';

export interface CartaAvaliada {
  carta: Carta;
  score: number;
  categoria: CategoriaCarta;
}

export interface ParametrosAvaliacaoCarta {
  limiarBaixa: number;
  limiarAlta: number;
  limiarSegura: number;
  pesoDensidade: number;
  baseManilha: number;
}

export const parametrosAvaliacaoPadrao: ParametrosAvaliacaoCarta = {
  limiarBaixa: 5.6,
  limiarAlta: 11,
  limiarSegura: 20,
  pesoDensidade: 3,
  baseManilha: 14,
};

const hierarquiaValores: Record<Valor, number> = {
  '3': 13,
  '2': 12,
  A: 11,
  K: 10,
  Q: 9,
  J: 8,
  '10': 7,
  '9': 6,
  '8': 5,
  '7': 4,
  '6': 3,
  '5': 2,
  '4': 1,
};

const offsetManilha: Record<Naipe, number> = {
  '♣': 9,
  '♥': 6,
  '♠': 3,
  '♦': 0,
};

// A issue define esta assinatura pública para consumo pelos próximos slices.
// eslint-disable-next-line max-params
export function avaliarCartas(
  mao: Carta[],
  manilha: Valor,
  cartasReveladas: Carta[],
  numJogadores: number,
): CartaAvaliada[] {
  return mao.map((carta) =>
    avaliarCarta({ carta, manilha, cartasReveladas, numJogadores, cartasPorJogador: mao.length }),
  );
}

interface ContextoAvaliacao {
  carta: Carta;
  manilha: Valor;
  cartasReveladas: Carta[];
  numJogadores: number;
  cartasPorJogador: number;
}

function avaliarCarta(contexto: ContextoAvaliacao): CartaAvaliada {
  const { carta, manilha, cartasReveladas } = contexto;
  const score = calcularScore(carta, manilha, cartasReveladas);
  const categoria = obterCategoria({ ...contexto, score });
  return { carta, score, categoria };
}

function calcularScore(carta: Carta, manilha: Valor, cartasReveladas: Carta[]): number {
  if (ehManilha(carta, manilha)) return parametrosAvaliacaoPadrao.baseManilha + offsetManilha[carta.naipe];

  return hierarquiaValores[carta.valor] + contarSuperioresReveladas(carta, manilha, cartasReveladas);
}

function contarSuperioresReveladas(carta: Carta, manilha: Valor, cartasReveladas: Carta[]): number {
  return cartasReveladas.filter((revelada) => cartaVence(revelada, carta, manilha)).length;
}

interface ContextoCategoria {
  carta: Carta;
  manilha: Valor;
  cartasReveladas: Carta[];
  numJogadores: number;
  cartasPorJogador: number;
  score: number;
}

function obterCategoria(contexto: ContextoCategoria): CategoriaCarta {
  if (ehGarantidaAgora(contexto.carta, contexto.manilha, contexto.cartasReveladas)) return 'garantida_agora';

  const limiares = calcularLimiares(contexto.cartasPorJogador, contexto.numJogadores);
  if (contexto.score >= limiares.segura) return 'segura';
  if (contexto.score >= limiares.alta) return 'alta';
  if (contexto.score < limiares.baixa) return 'baixa';
  return 'média';
}

function calcularLimiares(
  cartasPorJogador: number,
  numJogadores: number,
): { baixa: number; alta: number; segura: number } {
  const ajuste = (cartasPorJogador * numJogadores * parametrosAvaliacaoPadrao.pesoDensidade) / 52;
  return {
    baixa: parametrosAvaliacaoPadrao.limiarBaixa - ajuste,
    alta: parametrosAvaliacaoPadrao.limiarAlta + ajuste,
    segura: parametrosAvaliacaoPadrao.limiarSegura + ajuste,
  };
}

function ehGarantidaAgora(carta: Carta, manilha: Valor, cartasReveladas: Carta[]): boolean {
  if (ehManilha(carta, manilha)) return false;

  return cartasVivas(carta, cartasReveladas).every(
    (viva) => !cartaVence(viva, carta, manilha) && !cartasEmpatam(viva, carta, manilha),
  );
}

function cartasVivas(cartaAvaliada: Carta, cartasReveladas: Carta[]): Carta[] {
  return criarBaralho().filter(
    (carta) => !mesmaCarta(carta, cartaAvaliada) && !cartasReveladas.some((revelada) => mesmaCarta(carta, revelada)),
  );
}

function mesmaCarta(a: Carta, b: Carta): boolean {
  return a.valor === b.valor && a.naipe === b.naipe;
}
