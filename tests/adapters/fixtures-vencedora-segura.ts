import type { Carta } from '@/core/Carta';
import type { EstadoEmJogo } from '@/types/estado-rodada';
import { criarCarta, criarJogador } from '../core/rodada-fixtures';

export function criarEstadoVencedoraSegura(config: Partial<EstadoEmJogo> = {}): EstadoEmJogo {
  return criarEstadoBase({
    mesa: [{ jogadorId: 'j1', carta: criarCarta('2', '♣') }],
    declaracoes: { j1: 1, j2: 1, bot: 1 },
    vazas: { j1: 0, j2: 0, bot: 0 },
    manilha: '8',
    cartasReveladas: [],
    ...config,
  });
}

export function cenarioVencedoraSegura(): EstadoEmJogo {
  return criarEstadoVencedoraSegura();
}

export function maoVencedoraSegura(): Carta[] {
  return [criarCarta('3', '♦'), criarCarta('7', '♦')];
}

export function cartasReveladasGarantidaTres(): Carta[] {
  return [
    criarCarta('3', '♣'),
    criarCarta('3', '♥'),
    criarCarta('3', '♠'),
    criarCarta('8', '♣'),
    criarCarta('8', '♥'),
    criarCarta('8', '♠'),
    criarCarta('8', '♦'),
  ];
}

export const cenarioRecusaVencedoraSegura = [
  {
    nome: 'não há necessidade',
    estado: criarEstadoVencedoraSegura({ declaracoes: { j1: 1, j2: 1, bot: 1 }, vazas: { bot: 1 } }),
    mao: maoVencedoraSegura(),
  },
  {
    nome: 'urgência é alta',
    estado: criarEstadoVencedoraSegura({ declaracoes: { j1: 1, j2: 1, bot: 2 }, vazas: { bot: 0 } }),
    mao: [criarCarta('3', '♦'), criarCarta('7', '♦'), criarCarta('9', '♦')],
  },
  {
    nome: 'existe garantida para depois',
    estado: criarEstadoVencedoraSegura({
      manilha: '8',
      cartasReveladas: cartasReveladasGarantidaTres(),
    }),
    mao: [criarCarta('3', '♦'), criarCarta('7', '♦')],
  },
  {
    nome: 'líder já cumpriu',
    estado: criarEstadoVencedoraSegura({ vazas: { j1: 1 } }),
    mao: maoVencedoraSegura(),
  },
  {
    nome: 'líder não é alta+',
    estado: criarEstadoVencedoraSegura({ mesa: [{ jogadorId: 'j1', carta: criarCarta('9', '♣') }] }),
    mao: [criarCarta('Q', '♦'), criarCarta('7', '♦')],
  },
  {
    nome: 'não há vencedora segura',
    estado: criarEstadoVencedoraSegura({ cartasPorRodada: 8 }),
    mao: [
      criarCarta('3', '♦'),
      criarCarta('7', '♦'),
      criarCarta('6', '♦'),
      criarCarta('5', '♠'),
      criarCarta('4', '♥'),
      criarCarta('9', '♣'),
      criarCarta('J', '♠'),
      criarCarta('Q', '♥'),
    ],
  },
];

function criarEstadoBase(config: Partial<EstadoEmJogo>): EstadoEmJogo {
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
