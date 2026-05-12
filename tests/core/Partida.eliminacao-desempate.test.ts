import { describe, expect, it } from 'vitest';
import { Partida } from '@/core/Partida';
import type { Rodada } from '@/core/Rodada';
import { createEmissorEventos } from '@/store/emissor-eventos';
import type { Jogador } from '@/types/entidades';
import type { EstadoMutavel } from '@/types/estado-rodada';
import { criarDecisorPrimeiraCarta } from './rodada-fixtures';

function jogadoresComPontos(ids: string[]): Jogador[] {
  return ids.map((id) => ({ id, nome: id.toUpperCase(), pontos: 5 }));
}

function criarPartida(jogadores: Jogador[]): Partida {
  const decisoresJogada = new Map(jogadores.map((jogador) => [jogador.id, criarDecisorPrimeiraCarta()]));
  return new Partida(jogadores, createEmissorEventos(), {
    jogada: decisoresJogada,
    declaracao: new Map(),
  });
}

function concluirRodadaComPontos(partida: Partida, pontos: Record<string, number>): void {
  const rodada = partida.iniciarProximaRodada() as Rodada;
  rodada.restaurarEstado({
    ...rodada.estado,
    fase: 'rodadaConcluida',
    pontos,
  } as EstadoMutavel);
}

describe('Partida — desempate de eliminação sem pontos', () => {
  it('deve encerrar quando 2 jogadores zeram diferente e só o maior sobrevive', () => {
    const partida = criarPartida(jogadoresComPontos(['j1', 'j2']));
    concluirRodadaComPontos(partida, { j1: 0, j2: -1 });
    const proximaRodada = partida.iniciarProximaRodada();
    expect(proximaRodada).toBeUndefined();
    expect(partida.estado.jogadoresAtivos).toEqual(['j1']);
    expect(partida.estado.jogoEncerrado).toBe(true);
  });

  it('deve continuar quando 2 jogadores empatam no topo sem pontos positivos', () => {
    const partida = criarPartida(jogadoresComPontos(['j1', 'j2']));
    concluirRodadaComPontos(partida, { j1: -1, j2: -1 });
    partida.iniciarProximaRodada();
    expect(partida.estado.jogadoresAtivos).toEqual(['j1', 'j2']);
    expect(partida.estado.jogoEncerrado).toBe(false);
    expect(partida.estado.pontos).toMatchObject({ j1: -1, j2: -1 });
  });

  it('deve manter apenas o maior quando 3 jogadores ficam sem pontos', () => {
    const partida = criarPartida(jogadoresComPontos(['j1', 'j2', 'j3']));
    concluirRodadaComPontos(partida, { j1: -1, j2: 0, j3: -2 });
    const proximaRodada = partida.iniciarProximaRodada();
    expect(proximaRodada).toBeUndefined();
    expect(partida.estado.jogadoresAtivos).toEqual(['j2']);
  });
});

describe('Partida — desempate de eliminação com 3 jogadores sem pontos', () => {
  it('deve manter empatados no topo quando 3 jogadores ficam sem pontos', () => {
    const partida = criarPartida(jogadoresComPontos(['j1', 'j2', 'j3']));
    concluirRodadaComPontos(partida, { j1: 0, j2: 0, j3: -2 });
    partida.iniciarProximaRodada();
    expect(partida.estado.jogadoresAtivos).toEqual(['j1', 'j2']);
    expect(partida.estado.pontos).toMatchObject({ j1: 0, j2: 0 });
  });
});

describe('Partida — eliminação com jogadores positivos', () => {
  it('deve eliminar jogadores sem pontos quando existe 1 positivo', () => {
    const partida = criarPartida(jogadoresComPontos(['j1', 'j2', 'j3']));
    concluirRodadaComPontos(partida, { j1: 2, j2: 0, j3: -1 });
    const proximaRodada = partida.iniciarProximaRodada();
    expect(proximaRodada).toBeUndefined();
    expect(partida.estado.jogadoresAtivos).toEqual(['j1']);
  });

  it('deve eliminar jogadores sem pontos quando existem 2 positivos', () => {
    const partida = criarPartida(jogadoresComPontos(['j1', 'j2', 'j3', 'j4']));
    concluirRodadaComPontos(partida, { j1: 2, j2: 1, j3: 0, j4: -1 });
    partida.iniciarProximaRodada();
    expect(partida.estado.jogadoresAtivos).toEqual(['j1', 'j2']);
  });
});
