import { describe, it, expect, vi } from 'vitest';
import type { Carta } from '@/core/Carta';
import type { DecisorJogada } from '@/core/portas/DecisorJogada';
import { Rodada } from '@/core/Rodada';
import { createEmissorEventos } from '@/store/emissor-eventos';
import type { FaseRodada } from '@/types/estado-rodada';
import { criarCarta, criarJogador, criarDecisorPrimeiraCarta } from './rodada-fixtures';

describe('Rodada — carta virada removida', () => {
  it('deve remover carta virada do baralho e não distribuir', () => {
    const emissor = createEmissorEventos();
    const jogadores = [criarJogador('j1', 'J1'), criarJogador('j2', 'J2')];
    const baralho: Carta[] = [
      criarCarta('A', '♣'),
      criarCarta('K', '♥'),
      criarCarta('Q', '♠'),
      criarCarta('J', '♦'),
      criarCarta('10', '♣'),
    ];
    const rodada = new Rodada(jogadores, emissor, { jogada: new Map(), declaracao: new Map() });
    rodada.distribuir(2, baralho);
    const todasCartas = rodada.estado.maos.flatMap((m) => m.cartas);
    expect(todasCartas).toHaveLength(4);
    expect(todasCartas).not.toContainEqual(criarCarta('A', '♣'));
    expect(rodada.estado.cartaVirada).toEqual(criarCarta('A', '♣'));
    expect(rodada.estado.manilha).toBe('2');
  });
});

describe('Rodada — evento MANILHA_VIRADA', () => {
  it('deve emitir MANILHA_VIRADA ao virar carta', () => {
    const emissor = createEmissorEventos();
    const handler = vi.fn<(ev: unknown) => void>();
    emissor.on('MANILHA_VIRADA', handler);
    const jogadores = [criarJogador('j1', 'J1')];
    const baralho: Carta[] = [criarCarta('5', '♥'), criarCarta('4', '♣')];
    const rodada = new Rodada(jogadores, emissor, { jogada: new Map(), declaracao: new Map() });
    rodada.distribuir(1, baralho);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: 'MANILHA_VIRADA',
        cartaVirada: criarCarta('5', '♥'),
        manilha: '6',
      }),
    );
  });
});

describe('Rodada — sem carta para virar', () => {
  it('deve definir manilha como 3 quando não há carta para virar', () => {
    const emissor = createEmissorEventos();
    const jogadores = [criarJogador('j1', 'J1')];
    const rodada = new Rodada(jogadores, emissor, { jogada: new Map(), declaracao: new Map() });
    rodada.distribuir(0, []);
    expect(rodada.estado.manilha).toBe('3');
    expect(rodada.estado.cartaVirada).toBeNull();
  });
});

describe('Rodada — manilha vence não-manilha', () => {
  it('deve fazer manilha vencer carta não-manilha', async () => {
    const emissor = createEmissorEventos();
    const jogadores = [criarJogador('j1', 'J1'), criarJogador('j2', 'J2')];
    const decisores = new Map<string, DecisorJogada>([
      ['j1', criarDecisorPrimeiraCarta()],
      ['j2', criarDecisorPrimeiraCarta()],
    ]);
    const rodada = new Rodada(jogadores, emissor, { jogada: decisores, declaracao: new Map() });
    const estadoPrivado = rodada as unknown as {
      _estado: { fase: FaseRodada; manilha: Carta['valor']; maos: { cartas: Carta[] }[] };
      fases: { definir(fase: FaseRodada): void };
    };
    estadoPrivado._estado.maos = [{ cartas: [criarCarta('3', '♦')] }, { cartas: [criarCarta('4', '♣')] }];
    estadoPrivado._estado.manilha = '4';
    estadoPrivado._estado.fase = 'aguardandoJogada';
    estadoPrivado.fases.definir('aguardandoJogada');
    await rodada.jogarTurno();
    await rodada.jogarTurno();
    expect(rodada.estado.vazas['j2']).toBe(1);
  });
});

describe('Rodada — desempate de manilhas', () => {
  it('deve desempatar manilhas pelo naipe', async () => {
    const emissor = createEmissorEventos();
    const jogadores = [criarJogador('j1', 'J1'), criarJogador('j2', 'J2')];
    const decisores = new Map<string, DecisorJogada>([
      ['j1', criarDecisorPrimeiraCarta()],
      ['j2', criarDecisorPrimeiraCarta()],
    ]);
    const rodada = new Rodada(jogadores, emissor, { jogada: decisores, declaracao: new Map() });
    const estadoPrivado = rodada as unknown as {
      _estado: { fase: FaseRodada; manilha: Carta['valor']; maos: { cartas: Carta[] }[] };
      fases: { definir(fase: FaseRodada): void };
    };
    estadoPrivado._estado.maos = [{ cartas: [criarCarta('4', '♦')] }, { cartas: [criarCarta('4', '♣')] }];
    estadoPrivado._estado.manilha = '4';
    estadoPrivado._estado.fase = 'aguardandoJogada';
    estadoPrivado.fases.definir('aguardandoJogada');
    await rodada.jogarTurno();
    await rodada.jogarTurno();
    expect(rodada.estado.vazas['j2']).toBe(1);
  });
});
