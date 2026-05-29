import type { Carta } from '@/core/Carta';
import type { EstadoEmJogo } from '@/types/estado-rodada';
import { criarCarta, criarJogador } from '../core/rodada-fixtures';
import { cartasQueGarantemTresDeOuros } from './fixtures-linha-fria';

export function criarEstadoAtravessia(config: Partial<EstadoEmJogo> = {}): EstadoEmJogo {
  return criarEstadoBase({
    mesa: [{ jogadorId: 'j1', carta: criarCarta('2', '♣') }],
    declaracoes: { j1: 1, bot: 3 },
    vazas: { j1: 0, bot: 0 },
    manilha: '4',
    cartasReveladas: cartasQueGarantemTresDeOuros(),
    ...config,
  });
}

export function maoAtravessia(): Carta[] {
  return [criarCarta('3', '♦'), criarCarta('4', '♣'), criarCarta('4', '♦')];
}

export const cenariosRecusaAtravessia = [
  {
    nome: 'não há necessidade',
    estado: criarEstadoAtravessia({ declaracoes: { j1: 1, bot: 1 }, vazas: { j1: 0, bot: 1 } }),
    mao: [criarCarta('A', '♦')],
  },
  {
    nome: 'urgência não é alta',
    estado: criarEstadoAtravessia({ declaracoes: { j1: 1, bot: 1 }, vazas: { j1: 0, bot: 0 } }),
    mao: [criarCarta('A', '♦'), criarCarta('3', '♦')],
  },
  {
    nome: 'líder já cumpriu',
    estado: criarEstadoAtravessia({ declaracoes: { j1: 1, bot: 2 }, vazas: { j1: 1, bot: 0 } }),
    mao: maoAtravessia(),
  },
  {
    nome: 'carta líder não é alta+',
    estado: criarEstadoAtravessia({ mesa: [{ jogadorId: 'j1', carta: criarCarta('9', '♣') }] }),
    mao: [criarCarta('Q', '♦'), criarCarta('K', '♦'), criarCarta('6', '♦')],
  },
  {
    nome: 'só há vencedora garantida_agora',
    estado: criarEstadoAtravessia({ declaracoes: { j1: 1, bot: 2 }, vazas: { j1: 0, bot: 0 } }),
    mao: [criarCarta('3', '♦'), criarCarta('6', '♦'), criarCarta('7', '♦')],
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
