import { afterEach, describe, expect, it, vi } from 'vitest';
import { fabricarPartida } from '@/adapters/phaser/factories/rodada-factory';
import type { CallbacksRodada } from '@/adapters/phaser/factories/subscricao-eventos-rodada';
import type { DecisorDeclaracao } from '@/core/portas/DecisorDeclaracao';
import type { DecisorJogada } from '@/core/portas/DecisorJogada';
import type { Jogador } from '@/types/entidades';
import { estadoEmJogo } from '@/types/estado-rodada';

function jogadores(): Jogador[] {
  return [
    { id: 'humano', nome: 'Humano', pontos: 5 },
    { id: 'bot1', nome: 'Bot 1', pontos: 5 },
    { id: 'bot2', nome: 'Bot 2', pontos: 5 },
    { id: 'bot3', nome: 'Bot 3', pontos: 5 },
  ];
}

function callbacks(): CallbacksRodada {
  return {
    onCartaJogada: vi.fn(),
    onTurnoGanho: vi.fn(),
    onTurnoEmpatado: vi.fn(),
    onRodadaEncerrada: vi.fn(),
  };
}

function decisoresHumanos(): { jogada: DecisorJogada; declaracao: DecisorDeclaracao } {
  return {
    jogada: { decidirJogada: vi.fn() },
    declaracao: { declarar: vi.fn() },
  };
}

function perfisDaPrimeiraRodada(seed: number) {
  vi.setSystemTime(seed);
  const partida = fabricarPartida(jogadores(), decisoresHumanos(), callbacks());
  partida.iniciarProximaRodada();
  return estadoEmJogo(partida.estado)
    .maos.map((mao) => mao.jogador)
    .filter((jogador) => jogador.id.startsWith('bot'));
}

describe('Factory da rodada', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('deve gerar os mesmos nomes e temperaturas com seed fixa', () => {
    vi.useFakeTimers();

    expect(perfisDaPrimeiraRodada(158)).toEqual(perfisDaPrimeiraRodada(158));
  });

  it('deve expor temperatura e nome sorteados nos jogadores bots', () => {
    vi.useFakeTimers();
    const perfis = perfisDaPrimeiraRodada(158);

    expect(perfis).toHaveLength(3);
    expect(perfis.every((perfil) => !perfil.nome.startsWith('Bot '))).toBe(true);
    expect(perfis.every((perfil) => perfil.temperatura !== undefined)).toBe(true);
  });
});
