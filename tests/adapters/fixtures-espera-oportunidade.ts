import type { Carta } from '@/core/Carta';
import type { EstadoEmJogo } from '@/types/estado-rodada';
import { criarCarta, criarJogador } from '../core/rodada-fixtures';

export function cenarioEsperaOportunidade(): EstadoEmJogo {
  return criarEstadoEspera({
    mesa: [{ jogadorId: 'j1', carta: criarCarta('2', '♣') }],
    declaracoes: { j1: 1, j2: 1, bot: 1 },
    vazas: { j1: 0, j2: 0, bot: 0 },
    cartasReveladas: cartasQueGarantemTresDeOuros(),
  });
}

export function maoEsperaOportunidade(): Carta[] {
  return [criarCarta('3', '♦'), criarCarta('7', '♦')];
}

export const cenarioRecusaEsperaOportunidade = [
  {
    nome: 'não há necessidade',
    estado: criarEstadoEspera({
      mesa: [{ jogadorId: 'j1', carta: criarCarta('2', '♣') }],
      declaracoes: { bot: 1 },
      vazas: { bot: 1 },
    }),
    mao: [criarCarta('7', '♦'), criarCarta('9', '♦')],
  },
  {
    nome: 'urgência é alta',
    estado: criarEstadoEspera({
      mesa: [{ jogadorId: 'j1', carta: criarCarta('2', '♣') }],
      declaracoes: { bot: 2 },
      vazas: { bot: 0 },
    }),
    mao: [criarCarta('7', '♦'), criarCarta('9', '♦'), criarCarta('Q', '♦')],
  },
  {
    nome: 'toda carta vence o líder',
    estado: criarEstadoEspera({
      mesa: [{ jogadorId: 'j1', carta: criarCarta('4', '♣') }],
      declaracoes: { bot: 1 },
      vazas: { bot: 0 },
      manilha: '5',
    }),
    mao: [criarCarta('3', '♦'), criarCarta('6', '♦')],
  },
];

function criarEstadoEspera(config: Partial<EstadoEmJogo>): EstadoEmJogo {
  const jogadores = [
    criarJogador('j1', 'J1'),
    criarJogador('j2', 'J2'),
    criarJogador('j3', 'J3'),
    criarJogador('bot', 'Bot'),
  ];
  return {
    fase: 'aguardandoJogada',
    jogadorAtual: 3,
    pontos: {},
    maos: jogadores.map((jogador) => ({ jogador, cartas: [], visivel: true })),
    cartasPorRodada: 3,
    manilha: '5',
    cartaVirada: null,
    declaracoes: {},
    mesa: [],
    cartasReveladas: [],
    vazas: {},
    turno: 1,
    ...config,
  };
}

function cartasQueGarantemTresDeOuros(): Carta[] {
  return [
    criarCarta('3', '♣'),
    criarCarta('3', '♥'),
    criarCarta('3', '♠'),
    criarCarta('5', '♣'),
    criarCarta('5', '♥'),
    criarCarta('5', '♠'),
    criarCarta('5', '♦'),
  ];
}
