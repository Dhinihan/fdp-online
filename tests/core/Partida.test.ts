import { describe, it, expect, vi } from 'vitest';
import type { Carta } from '@/core/Carta';
import { Partida } from '@/core/Partida';
import type { DecisorJogada } from '@/core/portas/DecisorJogada';
import { createEmissorEventos } from '@/store/emissor-eventos';
import type { Jogador } from '@/types/entidades';

function criarCarta(valor: Carta['valor'], naipe: Carta['naipe']): Carta {
  return { valor, naipe };
}

function criarJogador(id: string, nome: string): Jogador {
  return { id, nome, pontos: 5 };
}

function criarDecisor(carta: Carta): DecisorJogada {
  const mock = vi.fn<(mao: Carta[], estado: unknown) => Promise<Carta>>().mockResolvedValue(carta);
  return { decidirJogada: mock };
}

function criarDecisorPrimeiraCarta(): DecisorJogada {
  const mock = vi.fn<(mao: Carta[], estado: unknown) => Promise<Carta>>();
  mock.mockImplementation((mao: Carta[]) => Promise.resolve(mao[0]));
  return { decidirJogada: mock };
}

function criarPartida(config: {
  jogadores: Jogador[];
  decisores: Map<string, DecisorJogada>;
  emissor: ReturnType<typeof createEmissorEventos>;
}): Partida {
  const partida = new Partida(config.jogadores, config.decisores, config.emissor);
  partida.distribuir(1);
  return partida;
}

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
  });
});

describe('Partida — avanço de jogadorAtual', () => {
  it('deve avançar jogadorAtual em ordem anti-horária após cada jogada', async () => {
    const emissor = createEmissorEventos();
    const ids = ['j1', 'j2', 'j3', 'j4'];
    const jogadores = ids.map((id) => criarJogador(id, `Jogador ${id}`));
    const decisores = new Map<string, DecisorJogada>(
      ids.map((id, i) => [id, criarDecisor(criarCarta((i + 4).toString() as Carta['valor'], '♣'))]),
    );
    const partida = criarPartida({ jogadores, decisores, emissor });
    expect(partida.estado.jogadorAtual).toBe(0);
    for (let i = 0; i < 3; i++) {
      await partida.jogarTurno();
      expect(partida.estado.jogadorAtual).toBe(i + 1);
    }
    await partida.jogarTurno();
    expect(partida.estado.fase).toBe('turnoConcluido');
  });
});

describe('Partida — DecisorJogada', () => {
  it('deve chamar DecisorJogada para cada jogador em sequência', async () => {
    const emissor = createEmissorEventos();
    const jogadores = [criarJogador('j1', 'Jogador 1'), criarJogador('j2', 'Jogador 2')];
    const mock1 = vi.fn<(mao: Carta[], estado: unknown) => Promise<Carta>>().mockResolvedValue(criarCarta('4', '♣'));
    const mock2 = vi.fn<(mao: Carta[], estado: unknown) => Promise<Carta>>().mockResolvedValue(criarCarta('5', '♥'));
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

describe('Partida — mesa', () => {
  it('deve remover carta jogada da mão do jogador', async () => {
    const emissor = createEmissorEventos();
    const jogadores = [criarJogador('j1', 'Jogador 1'), criarJogador('j2', 'Jogador 2')];
    const decisores = new Map<string, DecisorJogada>([
      ['j1', criarDecisorPrimeiraCarta()],
      ['j2', criarDecisor(criarCarta('5', '♥'))],
    ]);
    const partida = criarPartida({ jogadores, decisores, emissor });
    const cartaEsperada = partida.estado.maos[0].cartas[0];
    const maoAntes = partida.estado.maos[0].cartas.length;
    await partida.jogarTurno();
    expect(partida.estado.maos[0].cartas).toHaveLength(maoAntes - 1);
    expect(partida.estado.mesa).toContainEqual(cartaEsperada);
  });
});

describe('Partida — eventos', () => {
  it('deve emitir evento CARTA_JOGADA ao jogar', async () => {
    const emissor = createEmissorEventos();
    const handler = vi.fn();
    emissor.on('CARTA_JOGADA', handler);
    const jogadores = [criarJogador('j1', 'Jogador 1')];
    const decisores = new Map<string, DecisorJogada>([['j1', criarDecisor(criarCarta('4', '♣'))]]);
    const partida = criarPartida({ jogadores, decisores, emissor });
    await partida.jogarTurno();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: 'CARTA_JOGADA',
        jogadorId: 'j1',
        carta: criarCarta('4', '♣'),
      }),
    );
  });
});
