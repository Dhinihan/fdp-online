import { describe, expect, it, vi } from 'vitest';
import { Partida } from '@/core/Partida';
import { createEmissorEventos } from '@/store/emissor-eventos';
import type { Jogador } from '@/types/entidades';
import { criarDecisorPrimeiraCarta, jogadoresPadrao } from './rodada-fixtures';

function criarPartida(jogadores: Jogador[] = jogadoresPadrao()): Partida {
  const decisoresJogada = new Map(jogadores.map((jogador) => [jogador.id, criarDecisorPrimeiraCarta()]));
  return new Partida(jogadores, createEmissorEventos(), {
    jogada: decisoresJogada,
    declaracao: new Map(),
  });
}

describe('Partida — contagem de cartas', () => {
  it('deve iniciar rodadas com contagem de cartas até 13 e manter em 13', () => {
    const partida = criarPartida();
    const cartasPorRodada: number[] = [];
    for (let i = 0; i < 15; i++) {
      partida.iniciarProximaRodada();
      cartasPorRodada.push(partida.estado.cartasPorRodada);
    }
    expect(cartasPorRodada).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 13, 13]);
  });
});

describe('Partida — estado público', () => {
  it('deve incrementar numeroRodada e expor jogadoresAtivos', () => {
    const jogadores = jogadoresPadrao();
    const partida = criarPartida(jogadores);
    partida.iniciarProximaRodada();
    partida.iniciarProximaRodada();
    expect(partida.estado.numeroRodada).toBe(2);
    expect(partida.estado.jogadoresAtivos).toEqual(jogadores.map((jogador) => jogador.id));
  });

  it('deve aplicar visibilidade invertida apenas na primeira rodada', () => {
    const jogadores = [
      { id: 'humano', nome: 'Humano', pontos: 5 },
      { id: 'bot1', nome: 'Bot 1', pontos: 5 },
    ];
    const partida = criarPartida(jogadores);
    partida.iniciarProximaRodada();
    expect(partida.estado.maos.map((mao) => [mao.jogador.id, mao.visivel])).toEqual([
      ['humano', false],
      ['bot1', true],
    ]);
    partida.iniciarProximaRodada();
    expect(partida.estado.maos.map((mao) => [mao.jogador.id, mao.visivel])).toEqual([
      ['humano', true],
      ['bot1', false],
    ]);
  });
});

describe('Partida — embaralhador', () => {
  it('deve rotacionar o embaralhador para o jogador à direita', () => {
    const partida = criarPartida();
    const embaralhadores: string[] = [];
    for (let i = 0; i < 5; i++) {
      partida.iniciarProximaRodada();
      embaralhadores.push(partida.estado.embaralhadorId);
    }
    expect(embaralhadores).toEqual(['j4', 'j1', 'j2', 'j3', 'j4']);
  });
});

describe('Partida — eventos', () => {
  it('deve emitir RODADA_INICIADA no início de cada rodada', () => {
    const emissor = createEmissorEventos();
    const handler = vi.fn<(ev: unknown) => void>();
    emissor.on('RODADA_INICIADA', handler);
    const jogadores = jogadoresPadrao();
    const decisoresJogada = new Map(jogadores.map((jogador) => [jogador.id, criarDecisorPrimeiraCarta()]));
    const partida = new Partida(jogadores, emissor, { jogada: decisoresJogada, declaracao: new Map() });
    partida.iniciarProximaRodada();
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: 'RODADA_INICIADA',
        numeroRodada: 1,
        cartasPorRodada: 1,
        jogadoresAtivos: ['j1', 'j2', 'j3', 'j4'],
      }),
    );
  });
});
