import { describe, it, expect, vi } from 'vitest';
import type { Carta } from '@/core/Carta';
import { Partida } from '@/core/Partida';
import type { DecisorJogada } from '@/core/portas/DecisorJogada';
import { createEmissorEventos } from '@/store/emissor-eventos';
import type { Jogador } from '@/types/entidades';
import type { EstadoPartida } from '@/types/estado-partida';

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

interface EstadoPrivado {
  _estado: EstadoPartida;
}

function criarPartidaComMao(config: {
  jogadores: Jogador[];
  decisores: Map<string, DecisorJogada>;
  emissor: ReturnType<typeof createEmissorEventos>;
  maos: Carta[][];
  jogadorAtual?: number;
  fase?: EstadoPartida['fase'];
}): Partida {
  const partida = new Partida(config.jogadores, config.decisores, config.emissor);
  const estado = (partida as unknown as EstadoPrivado)._estado;
  estado.maos = config.jogadores.map((jogador, i) => ({
    jogador,
    cartas: config.maos[i] ?? [],
    visivel: jogador.id === 'humano',
  }));
  estado.fase = config.fase ?? 'aguardandoJogada';
  estado.jogadorAtual = config.jogadorAtual ?? 0;
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
    const decisores = new Map<string, DecisorJogada>(ids.map((id) => [id, criarDecisorPrimeiraCarta()]));
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
    const mock1 = vi
      .fn<(mao: Carta[], estado: unknown) => Promise<Carta>>()
      .mockImplementation((mao) => Promise.resolve(mao[0]));
    const mock2 = vi
      .fn<(mao: Carta[], estado: unknown) => Promise<Carta>>()
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

describe('Partida — mesa', () => {
  it('deve remover carta jogada da mão do jogador', async () => {
    const emissor = createEmissorEventos();
    const jogadores = [criarJogador('j1', 'Jogador 1'), criarJogador('j2', 'Jogador 2')];
    const decisores = new Map<string, DecisorJogada>([
      ['j1', criarDecisorPrimeiraCarta()],
      ['j2', criarDecisorPrimeiraCarta()],
    ]);
    const partida = criarPartida({ jogadores, decisores, emissor });
    const cartaEsperada = partida.estado.maos[0].cartas[0];
    const maoAntes = partida.estado.maos[0].cartas.length;
    await partida.jogarTurno();
    expect(partida.estado.maos[0].cartas).toHaveLength(maoAntes - 1);
    expect(partida.estado.mesa).toContainEqual(cartaEsperada);
  });

  it('deve remover carta por valor/naipe mesmo com referência diferente', async () => {
    const emissor = createEmissorEventos();
    const jogadores = [criarJogador('j1', 'Jogador 1')];
    const mao = [criarCarta('4', '♣')];
    const decisor = criarDecisor(criarCarta('4', '♣'));
    const partida = criarPartidaComMao({ jogadores, decisores: new Map([['j1', decisor]]), emissor, maos: [mao] });
    await partida.jogarTurno();
    expect(partida.estado.maos[0].cartas).toHaveLength(0);
    expect(partida.estado.mesa).toContainEqual(criarCarta('4', '♣'));
  });
});

describe('Partida — eventos', () => {
  it('deve emitir evento CARTA_JOGADA ao jogar', async () => {
    const emissor = createEmissorEventos();
    const handler = vi.fn();
    emissor.on('CARTA_JOGADA', handler);
    const jogadores = [criarJogador('j1', 'Jogador 1')];
    const decisores = new Map<string, DecisorJogada>([['j1', criarDecisorPrimeiraCarta()]]);
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

describe('Partida — hardening', () => {
  it('deve restaurar fase para aguardandoJogada quando decisor rejeita', async () => {
    const emissor = createEmissorEventos();
    const jogadores = [criarJogador('j1', 'Jogador 1')];
    const decisor = { decidirJogada: vi.fn().mockRejectedValue(new Error('Erro do decisor')) };
    const partida = criarPartida({ jogadores, decisores: new Map([['j1', decisor]]), emissor });
    await expect(partida.jogarTurno()).rejects.toThrow('Erro do decisor');
    expect(partida.estado.fase).toBe('aguardandoJogada');
  });

  it('deve restaurar fase quando carta retornada não está na mão', async () => {
    const emissor = createEmissorEventos();
    const jogadores = [criarJogador('j1', 'Jogador 1')];
    const mao = [criarCarta('4', '♣')];
    const decisor = criarDecisor(criarCarta('5', '♥'));
    const partida = criarPartidaComMao({ jogadores, decisores: new Map([['j1', decisor]]), emissor, maos: [mao] });
    await expect(partida.jogarTurno()).rejects.toThrow('Jogada inválida');
    expect(partida.estado.fase).toBe('aguardandoJogada');
  });

  it('deve restaurar fase quando decisor não é encontrado', async () => {
    const emissor = createEmissorEventos();
    const jogadores = [criarJogador('j1', 'Jogador 1')];
    const partida = criarPartidaComMao({ jogadores, decisores: new Map(), emissor, maos: [[criarCarta('4', '♣')]] });
    await expect(partida.jogarTurno()).rejects.toThrow('Decisor não encontrado');
    expect(partida.estado.fase).toBe('aguardandoJogada');
  });
});
