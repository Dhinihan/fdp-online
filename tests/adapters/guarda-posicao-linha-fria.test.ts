import { describe, expect, it } from 'vitest';
import { decidirNaoUltimoLinhaFria } from '@/adapters/bots/DecisorJogadaLinhaFria';
import type { Carta } from '@/core/Carta';
import type { EstadoEmJogo } from '@/types/estado-rodada';
import { criarCarta, criarJogador } from '../core/rodada-fixtures';

interface CenarioGuarda {
  nome: string;
  mao: Carta[];
  estado: EstadoEmJogo;
  esperado: { carta: Carta; motivo: string; caminho?: string[] };
}

const cenarios: CenarioGuarda[] = [
  {
    nome: 'deve bloquear tentativa quando um jogador por agir ainda precisa e não há vencedora garantida',
    mao: [criarCarta('7', '♦'), criarCarta('K', '♦')],
    estado: criarEstadoComUmPorAgir({ declaracoes: { j2: 1, j3: 1 }, vazas: { j2: 0, j3: 0 } }),
    esperado: decisaoBloqueada(criarCarta('7', '♦')),
  },
  {
    nome: 'deve bloquear tentativa quando dois jogadores por agir incluem interessado e não há urgência alta',
    mao: [criarCarta('7', '♦'), criarCarta('K', '♦')],
    estado: criarEstadoComDoisPorAgir({
      declaracoes: { j2: 1, j3: 1, bot: 0 },
      vazas: { j2: 0, j3: 0, bot: 0 },
    }),
    esperado: decisaoBloqueada(criarCarta('7', '♦')),
  },
  {
    nome: 'deve permitir tentativa com dois jogadores por agir quando todos já cumpriram',
    mao: [criarCarta('7', '♦'), criarCarta('K', '♦')],
    estado: criarEstadoComDoisPorAgir({
      declaracoes: { j2: 1, j3: 1, bot: 0 },
      vazas: { j2: 0, j3: 1, bot: 0 },
    }),
    esperado: decisaoGanhadora(criarCarta('K', '♦')),
  },
  {
    nome: 'deve permitir tentativa com jogador interessado por agir quando há urgência alta',
    mao: [criarCarta('7', '♦'), criarCarta('K', '♦')],
    estado: criarEstadoComDoisPorAgir({ declaracoes: { j2: 2, j3: 1 }, vazas: { j2: 0, j3: 0 } }),
    esperado: decisaoGanhadora(criarCarta('K', '♦')),
  },
  {
    nome: 'deve permitir tentativa quando o único jogador por agir já cumpriu',
    mao: [criarCarta('7', '♦'), criarCarta('K', '♦')],
    estado: criarEstadoComUmPorAgir({ declaracoes: { j2: 1, j3: 1 }, vazas: { j2: 0, j3: 1 } }),
    esperado: decisaoGanhadora(criarCarta('K', '♦')),
  },
  {
    nome: 'deve permitir tentativa com um jogador interessado por agir quando existe vencedora garantida',
    mao: [criarCarta('7', '♦'), criarCarta('3', '♦')],
    estado: criarEstadoComUmPorAgir({
      declaracoes: { j2: 1, j3: 1 },
      vazas: { j2: 0, j3: 0 },
      manilha: '4',
      cartasReveladas: cartasQueGarantemTresDeOuros(),
    }),
    esperado: decisaoGanhadora(criarCarta('3', '♦')),
  },
  {
    nome: 'deve jogar carta mais barata quando a guarda bloqueia e nenhuma carta deixa de fazer',
    mao: [criarCarta('K', '♦'), criarCarta('A', '♦')],
    estado: criarEstadoComUmPorAgir({ declaracoes: { j2: 1, j3: 1 }, vazas: { j2: 0, j3: 0 } }),
    esperado: {
      ...decisaoBloqueada(criarCarta('K', '♦')),
      motivo: 'guarda de posição bloqueou; jogador por agir ainda precisa; fuga impossível',
    },
  },
];

describe('guarda de posição da linha fria', () => {
  it.each(cenarios)('$nome', ({ mao, estado, esperado }) => {
    expect(decidirNaoUltimoLinhaFria(mao, estado)).toEqual(esperado);
  });
});

function criarEstadoComUmPorAgir(config: Partial<EstadoEmJogo>): EstadoEmJogo {
  return criarEstado({
    jogadorAtual: 1,
    mesa: [
      { jogadorId: 'j1', carta: criarCarta('8', '♣') },
      { jogadorId: 'bot', carta: criarCarta('6', '♣') },
    ],
    manilha: '5',
    ...config,
  });
}

function criarEstadoComDoisPorAgir(config: Partial<EstadoEmJogo>): EstadoEmJogo {
  return criarEstado({
    jogadorAtual: 1,
    mesa: [{ jogadorId: 'j1', carta: criarCarta('8', '♣') }],
    manilha: '5',
    ...config,
  });
}

function criarEstado(config: Partial<EstadoEmJogo>): EstadoEmJogo {
  const jogadores = ['j1', 'j2', 'j3', 'bot'].map((id) => criarJogador(id, id === 'bot' ? 'Bot' : id.toUpperCase()));
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

function decisaoBloqueada(carta: Carta): CenarioGuarda['esperado'] {
  return {
    carta,
    motivo: 'guarda de posição bloqueou; jogador por agir ainda precisa',
    caminho: ['jogada', 'joga no meio', 'linha fria', 'guarda de posição bloqueou'],
  };
}

function decisaoGanhadora(carta: Carta): CenarioGuarda['esperado'] {
  return { carta, motivo: 'precisa fazer; regra G[N-X]' };
}

function cartasQueGarantemTresDeOuros(): Carta[] {
  return [
    criarCarta('3', '♣'),
    criarCarta('3', '♥'),
    criarCarta('3', '♠'),
    criarCarta('4', '♣'),
    criarCarta('4', '♥'),
    criarCarta('4', '♠'),
    criarCarta('4', '♦'),
  ];
}
