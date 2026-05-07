import { describe, it, expect, vi } from 'vitest';
import type { Carta } from '@/core/Carta';
import type { DecisorDeclaracao } from '@/core/portas/DecisorDeclaracao';
import type { DecisorJogada } from '@/core/portas/DecisorJogada';
import { Rodada } from '@/core/Rodada';
import { createEmissorEventos } from '@/store/emissor-eventos';
import type { Jogador } from '@/types/entidades';
import { criarCarta, criarJogador, criarDecisor, criarRodada } from './rodada-fixtures';

function jogadoresComHumano(): Jogador[] {
  return [criarJogador('humano', 'Humano'), criarJogador('bot1', 'Bot 1'), criarJogador('bot2', 'Bot 2')];
}

function criarRodadaVisibilidade(numeroRodada: number): Rodada {
  return new Rodada(jogadoresComHumano(), createEmissorEventos(), {
    jogada: new Map(),
    declaracao: new Map(),
    numeroRodada,
  });
}

describe('Rodada — transições', () => {
  it('deve iniciar na fase distribuindo e avançar para aguardandoJogada', () => {
    const emissor = createEmissorEventos();
    const jogadores = [criarJogador('j1', 'Jogador 1'), criarJogador('j2', 'Jogador 2')];
    const decisores = new Map<string, DecisorJogada>([
      ['j1', criarDecisor(criarCarta('4', '♣'))],
      ['j2', criarDecisor(criarCarta('5', '♥'))],
    ]);
    const rodada = new Rodada(jogadores, emissor, { jogada: decisores, declaracao: new Map() });
    expect(rodada.estado.fase).toBe('distribuindo');
    rodada.distribuir(1);
    expect(rodada.estado.fase).toBe('aguardandoDeclaracao');
    expect(rodada.estado.jogadorAtual).toBe(0);
    expect(rodada.estado.cartasPorRodada).toBe(1);
  });
});

describe('Rodada — visibilidade', () => {
  it('deve ocultar a mão do humano e mostrar as mãos dos bots na primeira rodada', () => {
    const rodada = criarRodadaVisibilidade(1);
    rodada.distribuir(1);
    expect(rodada.estado.maos.map((mao) => [mao.jogador.id, mao.visivel])).toEqual([
      ['humano', false],
      ['bot1', true],
      ['bot2', true],
    ]);
  });

  it('deve mostrar a mão do humano e ocultar as mãos dos bots depois da primeira rodada', () => {
    const rodada = criarRodadaVisibilidade(2);
    rodada.distribuir(2);
    expect(rodada.estado.maos.map((mao) => [mao.jogador.id, mao.visivel])).toEqual([
      ['humano', true],
      ['bot1', false],
      ['bot2', false],
    ]);
  });
});

describe('Rodada — informação dos decisores', () => {
  it('deve entregar a mão completa ao decisor mesmo quando ela não está visível', async () => {
    const emissor = createEmissorEventos();
    const jogadores = [criarJogador('humano', 'Humano')];
    const declarar: DecisorDeclaracao['declarar'] = vi.fn().mockResolvedValue(0);
    const rodada = new Rodada(jogadores, emissor, {
      jogada: new Map(),
      declaracao: new Map([['humano', { declarar }]]),
      numeroRodada: 1,
    });
    rodada.distribuir(1);
    await rodada.declarar();
    const chamadas = vi.mocked(declarar).mock.calls;
    expect(chamadas).toHaveLength(1);
    const chamada = chamadas[0];
    expect(chamada[0].maos[0].visivel).toBe(false);
    expect(chamada[1]).toEqual(rodada.estado.maos[0].cartas);
  });
});

describe('Rodada — avanço de jogadorAtual', () => {
  it('deve avançar jogadorAtual em ordem anti-horária após cada jogada', async () => {
    const emissor = createEmissorEventos();
    const ids = ['j1', 'j2', 'j3', 'j4'];
    const jogadores = ids.map((id) => criarJogador(id, `Jogador ${id}`));
    const decisores = new Map<string, DecisorJogada>(
      ids.map((id) => [id, { decidirJogada: (mao: Carta[]) => Promise.resolve(mao[0]) }]),
    );
    const rodada = criarRodada({ jogadores, decisores, emissor, cartasPorRodada: 4 });
    expect(rodada.estado.jogadorAtual).toBe(0);
    for (let i = 0; i < 3; i++) {
      await rodada.jogarTurno();
      expect(rodada.estado.jogadorAtual).toBe(i + 1);
    }
    await rodada.jogarTurno();
    expect(rodada.estado.fase).toBe('aguardandoJogada');
    expect(rodada.estado.turno).toBe(2);
  });
});

describe('Rodada — DecisorJogada', () => {
  it('deve chamar DecisorJogada para cada jogador em sequência', async () => {
    const emissor = createEmissorEventos();
    const jogadores = [criarJogador('j1', 'Jogador 1'), criarJogador('j2', 'Jogador 2')];
    const mock1 = vi
      .fn<(mao: import('@/core/Carta').Carta[], estado: unknown) => Promise<import('@/core/Carta').Carta>>()
      .mockImplementation((mao) => Promise.resolve(mao[0]));
    const mock2 = vi
      .fn<(mao: import('@/core/Carta').Carta[], estado: unknown) => Promise<import('@/core/Carta').Carta>>()
      .mockImplementation((mao) => Promise.resolve(mao[0]));
    const decisores = new Map<string, DecisorJogada>([
      ['j1', { decidirJogada: mock1 }],
      ['j2', { decidirJogada: mock2 }],
    ]);
    const rodada = criarRodada({ jogadores, decisores, emissor });
    await rodada.jogarTurno();
    expect(mock1).toHaveBeenCalledTimes(1);
    expect(mock2).not.toHaveBeenCalled();
    await rodada.jogarTurno();
    expect(mock1).toHaveBeenCalledTimes(1);
    expect(mock2).toHaveBeenCalledTimes(1);
  });
});

describe('Rodada — eventos', () => {
  it('deve emitir evento CARTA_JOGADA ao jogar', async () => {
    const emissor = createEmissorEventos();
    const handler = vi.fn<(ev: unknown) => void>();
    emissor.on('CARTA_JOGADA', handler);
    const jogadores = [criarJogador('j1', 'Jogador 1')];
    const decisores = new Map<string, DecisorJogada>([
      ['j1', { decidirJogada: (mao: Carta[]) => Promise.resolve(mao[0]) }],
    ]);
    const rodada = criarRodada({ jogadores, decisores, emissor });
    const cartaEsperada = rodada.estado.maos[0].cartas[0];
    await rodada.jogarTurno();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: 'CARTA_JOGADA',
        jogadorId: 'j1',
        carta: cartaEsperada,
      }),
    );
  });
});
