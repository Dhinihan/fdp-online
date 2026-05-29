import { describe, expect, it } from 'vitest';
import { avaliarGuardaDePosicao } from '@/adapters/bots/guarda-posicao';
import { lerMesa } from '@/adapters/bots/ler-mesa';
import { criarCarta } from '../core/rodada-fixtures';
import {
  cartasQueGarantemTresDeOuros,
  criarEstadoComDoisPorAgir,
  criarEstadoComUmPorAgir,
} from './fixtures-linha-fria';

const maoUrgenciaAlta = [criarCarta('4', '♦'), criarCarta('7', '♦'), criarCarta('A', '♦')];
const maoPadrao = [criarCarta('5', '♦'), criarCarta('9', '♦')];
const maoGarantida = [criarCarta('7', '♦'), criarCarta('3', '♦')];

const cenarios = [
  {
    nome: 'deve permitir com urgência alta',
    estado: criarEstadoComUmPorAgir({ declaracoes: { j2: 2, j3: 1 }, vazas: { j2: 0, j3: 0 } }),
    mao: maoUrgenciaAlta,
    esperado: { permite: true, motivo: 'urgência alta' },
  },
  {
    nome: 'deve permitir quando jogadores por agir já cumpriram',
    estado: criarEstadoComDoisPorAgir({ declaracoes: { j2: 1, j3: 1, bot: 0 }, vazas: { j2: 0, j3: 1, bot: 0 } }),
    mao: maoPadrao,
    esperado: { permite: true, motivo: 'jogadores por agir já cumpriram' },
  },
  {
    nome: 'deve permitir com vencedora garantida e um jogador interessado por agir',
    estado: criarEstadoComUmPorAgir({
      declaracoes: { j2: 1, j3: 1 },
      vazas: { j2: 0, j3: 0 },
      manilha: '4',
      cartasReveladas: cartasQueGarantemTresDeOuros(),
    }),
    mao: maoGarantida,
    esperado: { permite: true, motivo: 'vencedora garantida agora' },
  },
  {
    nome: 'deve bloquear quando jogador por agir ainda precisa',
    estado: criarEstadoComUmPorAgir({ declaracoes: { j2: 1, j3: 1 }, vazas: { j2: 0, j3: 0 } }),
    mao: maoPadrao,
    esperado: { permite: false, motivo: 'jogador por agir ainda precisa' },
  },
  {
    nome: 'deve bloquear com dois por agir e alguém interessado sem urgência alta',
    estado: criarEstadoComDoisPorAgir({ declaracoes: { j2: 1, j3: 1, bot: 0 }, vazas: { j2: 0, j3: 0, bot: 0 } }),
    mao: maoPadrao,
    esperado: { permite: false, motivo: 'jogador por agir ainda precisa' },
  },
] as const;

describe('avaliarGuardaDePosicao', () => {
  it.each(cenarios)('$nome', ({ estado, mao, esperado }) => {
    expect(avaliarGuardaDePosicao(lerMesa(estado, mao))).toEqual(esperado);
  });
});
