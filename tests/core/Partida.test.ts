import { describe, it, expect, vi } from 'vitest';
import type { Carta } from '@/core/Carta';
import { Partida } from '@/core/Partida';
import type { DecisorJogada } from '@/core/portas/DecisorJogada';
import { createEmissorEventos } from '@/store/emissor-eventos';
import { criarCarta, criarJogador, criarDecisor, criarPartida } from './partida-fixtures';

describe('Partida — transições', () => {
  it('deve iniciar na fase distribuindo e avançar para aguardandoJogada', () => {
    const emissor = createEmissorEventos();
    const jogadores = [criarJogador('j1', 'Jogador 1'), criarJogador('j2', 'Jogador 2')];
    const decisores = new Map<string, DecisorJogada>([
      ['j1', criarDecisor(criarCarta('4', '♣'))],
      ['j2', criarDecisor(criarCarta('5', '♥'))],
    ]);
    const partida = new Partida(jogadores, decisores, emissor);
    expect(partida.estado.fase).toBe('distribuindo');
    partida.distribuir(1);
    expect(partida.estado.fase).toBe('aguardandoJogada');
    expect(partida.estado.jogadorAtual).toBe(0);
    expect(partida.estado.cartasPorRodada).toBe(1);
  });
});

describe('Partida — avanço de jogadorAtual', () => {
  it('deve avançar jogadorAtual em ordem anti-horária após cada jogada', async () => {
    const emissor = createEmissorEventos();
    const ids = ['j1', 'j2', 'j3', 'j4'];
    const jogadores = ids.map((id) => criarJogador(id, `Jogador ${id}`));
    const decisores = new Map<string, DecisorJogada>(
      ids.map((id) => [id, { decidirJogada: (mao: Carta[]) => Promise.resolve(mao[0]) }]),
    );
    const partida = criarPartida({ jogadores, decisores, emissor, cartasPorRodada: 4 });
    expect(partida.estado.jogadorAtual).toBe(0);
    for (let i = 0; i < 3; i++) {
      await partida.jogarTurno();
      expect(partida.estado.jogadorAtual).toBe(i + 1);
    }
    await partida.jogarTurno();
    expect(partida.estado.fase).toBe('aguardandoJogada');
    expect(partida.estado.turno).toBe(2);
  });
});

describe('Partida — DecisorJogada', () => {
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
    const partida = criarPartida({ jogadores, decisores, emissor });
    await partida.jogarTurno();
    expect(mock1).toHaveBeenCalledTimes(1);
    expect(mock2).not.toHaveBeenCalled();
    await partida.jogarTurno();
    expect(mock1).toHaveBeenCalledTimes(1);
    expect(mock2).toHaveBeenCalledTimes(1);
  });
});

describe('Partida — eventos', () => {
  it('deve emitir evento CARTA_JOGADA ao jogar', async () => {
    const emissor = createEmissorEventos();
    const handler = vi.fn<(ev: unknown) => void>();
    emissor.on('CARTA_JOGADA', handler);
    const jogadores = [criarJogador('j1', 'Jogador 1')];
    const decisores = new Map<string, DecisorJogada>([
      ['j1', { decidirJogada: (mao: Carta[]) => Promise.resolve(mao[0]) }],
    ]);
    const partida = criarPartida({ jogadores, decisores, emissor });
    const cartaEsperada = partida.estado.maos[0].cartas[0];
    await partida.jogarTurno();
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
