import { describe, expect, it } from 'vitest';
import { avaliarGuardaDePosicao } from '@/adapters/bots/guarda-posicao';
import { criarEstadoComDoisPorAgir, criarEstadoComUmPorAgir } from './fixtures-linha-fria';

const cenarios = [
  {
    nome: 'deve permitir com urgência alta',
    entrada: {
      estado: criarEstadoComUmPorAgir({ declaracoes: { j2: 1, j3: 1 }, vazas: { j2: 0, j3: 0 } }),
      necessidade: 2,
      tamanhoMao: 3,
      temGarantidaAgora: false,
    },
    esperado: { permite: true, motivo: 'urgência alta' },
  },
  {
    nome: 'deve permitir quando jogadores por agir já cumpriram',
    entrada: {
      estado: criarEstadoComDoisPorAgir({ declaracoes: { j2: 1, j3: 1, bot: 0 }, vazas: { j2: 0, j3: 1, bot: 0 } }),
      necessidade: 1,
      tamanhoMao: 2,
      temGarantidaAgora: false,
    },
    esperado: { permite: true, motivo: 'jogadores por agir já cumpriram' },
  },
  {
    nome: 'deve permitir com vencedora garantida e um jogador interessado por agir',
    entrada: {
      estado: criarEstadoComUmPorAgir({ declaracoes: { j2: 1, j3: 1 }, vazas: { j2: 0, j3: 0 } }),
      necessidade: 1,
      tamanhoMao: 2,
      temGarantidaAgora: true,
    },
    esperado: { permite: true, motivo: 'vencedora garantida agora' },
  },
  {
    nome: 'deve bloquear quando jogador por agir ainda precisa',
    entrada: {
      estado: criarEstadoComUmPorAgir({ declaracoes: { j2: 1, j3: 1 }, vazas: { j2: 0, j3: 0 } }),
      necessidade: 1,
      tamanhoMao: 2,
      temGarantidaAgora: false,
    },
    esperado: { permite: false, motivo: 'jogador por agir ainda precisa' },
  },
  {
    nome: 'deve bloquear com dois por agir e alguém interessado sem urgência alta',
    entrada: {
      estado: criarEstadoComDoisPorAgir({ declaracoes: { j2: 1, j3: 1, bot: 0 }, vazas: { j2: 0, j3: 0, bot: 0 } }),
      necessidade: 1,
      tamanhoMao: 2,
      temGarantidaAgora: false,
    },
    esperado: { permite: false, motivo: 'jogador por agir ainda precisa' },
  },
] as const;

describe('avaliarGuardaDePosicao', () => {
  it.each(cenarios)('$nome', ({ entrada, esperado }) => {
    expect(avaliarGuardaDePosicao(entrada)).toEqual(esperado);
  });
});
