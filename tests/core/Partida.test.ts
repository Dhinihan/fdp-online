import { describe, expect, it, vi } from 'vitest';
import { Partida } from '@/core/Partida';
import type { Rodada } from '@/core/Rodada';
import { createEmissorEventos } from '@/store/emissor-eventos';
import type { Jogador } from '@/types/entidades';
import { estadoEmJogo } from '@/types/estado-rodada';
import type { EventoDominio } from '@/types/eventos-dominio';
import { criarDecisorPrimeiraCarta, jogadoresPadrao } from './rodada-fixtures';

function criarPartida(jogadores: Jogador[] = jogadoresPadrao()): Partida {
  const decisoresJogada = new Map(jogadores.map((jogador) => [jogador.id, criarDecisorPrimeiraCarta()]));
  return new Partida(jogadores, createEmissorEventos(), {
    jogada: decisoresJogada,
    declaracao: new Map(),
  });
}

function concluirRodadaComPontos(partida: Partida, pontos: Record<string, number>): void {
  const rodada = partida.iniciarProximaRodada() as Rodada;
  rodada.estado.fase = 'rodadaConcluida';
  rodada.estado.pontos = pontos;
}

function criarPartidaComEmissor() {
  const emissor = createEmissorEventos();
  const jogadores = jogadoresPadrao();
  const decisoresJogada = new Map(jogadores.map((jogador) => [jogador.id, criarDecisorPrimeiraCarta()]));
  const partida = new Partida(jogadores, emissor, { jogada: decisoresJogada, declaracao: new Map() });
  return { emissor, partida };
}

describe('Partida — contagem de cartas', () => {
  it('deve iniciar rodadas com contagem de cartas até 13 e manter em 13', () => {
    const partida = criarPartida();
    const cartasPorRodada: number[] = [];
    for (let i = 0; i < 15; i++) {
      partida.iniciarProximaRodada();
      cartasPorRodada.push(estadoEmJogo(partida.estado).cartasPorRodada);
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
    expect(estadoEmJogo(partida.estado).maos.map((mao) => [mao.jogador.id, mao.visivel])).toEqual([
      ['humano', false],
      ['bot1', true],
    ]);
    partida.iniciarProximaRodada();
    expect(estadoEmJogo(partida.estado).maos.map((mao) => [mao.jogador.id, mao.visivel])).toEqual([
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
    const { emissor, partida } = criarPartidaComEmissor();
    const handler = vi.fn<(ev: unknown) => void>();
    emissor.on('RODADA_INICIADA', handler);
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

describe('Partida — eliminação', () => {
  it('deve eliminar jogador com 0 pontos', () => {
    const partida = criarPartida();
    concluirRodadaComPontos(partida, { j1: 0, j2: 4, j3: 5, j4: 5 });
    partida.iniciarProximaRodada();
    expect(partida.estado.jogadoresAtivos).toEqual(['j2', 'j3', 'j4']);
    expect(estadoEmJogo(partida.estado).maos.map((mao) => mao.jogador.id)).toEqual(['j2', 'j3', 'j4']);
  });

  it('deve eliminar jogador com pontos negativos', () => {
    const partida = criarPartida();
    concluirRodadaComPontos(partida, { j1: -1, j2: 4, j3: 5, j4: 5 });
    partida.iniciarProximaRodada();
    expect(partida.estado.jogadoresAtivos).toEqual(['j2', 'j3', 'j4']);
  });

  it('deve reiniciar a contagem em 1 após eliminação', () => {
    const partida = criarPartida();
    partida.iniciarProximaRodada();
    concluirRodadaComPontos(partida, { j1: 0, j2: 4, j3: 5, j4: 5 });
    partida.iniciarProximaRodada();
    expect(partida.estado.numeroRodada).toBe(1);
    expect(estadoEmJogo(partida.estado).cartasPorRodada).toBe(1);
  });

  it('deve continuar a contagem quando ninguém é eliminado', () => {
    const partida = criarPartida();
    concluirRodadaComPontos(partida, { j1: 4, j2: 4, j3: 5, j4: 5 });
    partida.iniciarProximaRodada();
    expect(partida.estado.numeroRodada).toBe(2);
  });
});

describe('Partida — eventos de eliminação', () => {
  it('deve emitir JOGADOR_ELIMINADO por jogador eliminado', () => {
    const { emissor, partida } = criarPartidaComEmissor();
    const handler = vi.fn<(ev: unknown) => void>();
    emissor.on('JOGADOR_ELIMINADO', handler);
    concluirRodadaComPontos(partida, { j1: 0, j2: -1, j3: 5, j4: 5 });
    partida.iniciarProximaRodada();
    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenNthCalledWith(1, expect.objectContaining({ tipo: 'JOGADOR_ELIMINADO' }));
  });
});

describe('Partida — encerramento', () => {
  it('deve encerrar quando sobra 1 sobrevivente', () => {
    const partida = criarPartida();
    concluirRodadaComPontos(partida, { j1: 2, j2: 0, j3: -1, j4: 0 });
    const proximaRodada = partida.iniciarProximaRodada();
    expect(proximaRodada).toBeUndefined();
    expect(partida.estado.jogoEncerrado).toBe(true);
    expect(partida.estado.jogadoresAtivos).toEqual(['j1']);
  });

  it('deve emitir JOGO_ENCERRADO com classificação final', () => {
    const { emissor, partida } = criarPartidaComEmissor();
    const handler = vi.fn<(ev: EventoDominio) => void>();
    emissor.on('JOGO_ENCERRADO', handler);
    concluirRodadaComPontos(partida, { j1: 2, j2: 0, j3: -1, j4: 0 });
    partida.iniciarProximaRodada();
    expect(handler).toHaveBeenCalledTimes(1);
    const evento = handler.mock.calls[0][0];
    expect(evento).toMatchObject({ tipo: 'JOGO_ENCERRADO' });
    if (evento.tipo !== 'JOGO_ENCERRADO') throw new Error('Evento JOGO_ENCERRADO não emitido');
    expect(evento.classificacao[0]).toMatchObject({ id: 'j1', pontos: 2 });
  });
});
