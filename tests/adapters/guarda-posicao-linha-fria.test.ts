import { describe, expect, it } from 'vitest';
import { decidirNaoUltimoLinhaFria } from '@/adapters/bots/DecisorJogadaLinhaFria';
import type { Carta } from '@/core/Carta';
import type { EstadoEmJogo } from '@/types/estado-rodada';
import { criarCarta } from '../core/rodada-fixtures';
import {
  CAMINHO_GUARDA_BLOQUEOU,
  CAMINHO_GUARDA_PERMITIU,
  cartasQueGarantemTresDeOuros,
  criarEstadoComDoisPorAgir,
  criarEstadoComUmPorAgir,
} from './fixtures-linha-fria';

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
    esperado: decisaoGanhadora(criarCarta('K', '♦'), 'jogadores por agir já cumpriram'),
  },
  {
    nome: 'deve permitir tentativa com jogador interessado por agir quando há urgência alta',
    mao: [criarCarta('7', '♦'), criarCarta('K', '♦')],
    estado: criarEstadoComDoisPorAgir({ declaracoes: { j2: 2, j3: 1 }, vazas: { j2: 0, j3: 0 } }),
    esperado: decisaoGanhadora(criarCarta('K', '♦'), 'urgência alta'),
  },
  {
    nome: 'deve permitir tentativa quando o único jogador por agir já cumpriu',
    mao: [criarCarta('7', '♦'), criarCarta('K', '♦')],
    estado: criarEstadoComUmPorAgir({ declaracoes: { j2: 1, j3: 1 }, vazas: { j2: 0, j3: 1 } }),
    esperado: decisaoGanhadora(criarCarta('K', '♦'), 'jogadores por agir já cumpriram'),
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
    esperado: decisaoGanhadora(criarCarta('3', '♦'), 'vencedora garantida agora'),
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

function decisaoBloqueada(carta: Carta): CenarioGuarda['esperado'] {
  return {
    carta,
    motivo: 'guarda de posição bloqueou; jogador por agir ainda precisa',
    caminho: [...CAMINHO_GUARDA_BLOQUEOU],
  };
}

function decisaoGanhadora(carta: Carta, motivoGuarda: string): CenarioGuarda['esperado'] {
  return {
    carta,
    motivo: `guarda de posição permitiu; ${motivoGuarda}; precisa fazer; regra G[N-X]`,
    caminho: [...CAMINHO_GUARDA_PERMITIU],
  };
}
