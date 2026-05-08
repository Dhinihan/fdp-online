import { describe, it, expect, vi } from 'vitest';
import type { DecisorDeclaracao } from '@/core/portas/DecisorDeclaracao';
import { Rodada } from '@/core/Rodada';
import { createEmissorEventos } from '@/store/emissor-eventos';
import { estadoEmJogo } from '@/types/estado-rodada';
import { criarJogador, jogadoresPadrao } from './rodada-fixtures';

function criarDecisorDeclaracao(valor: number): DecisorDeclaracao {
  return { declarar: vi.fn().mockResolvedValue(valor) };
}

describe('Rodada — declaração — transições', () => {
  it('deve iniciar na fase aguardandoDeclaracao apos distribuir', () => {
    const emissor = createEmissorEventos();
    const jogadores = jogadoresPadrao();
    const rodada = new Rodada(jogadores, emissor, { jogada: new Map(), declaracao: new Map() });
    expect(rodada.estado.fase).toBe('distribuindo');
    rodada.distribuir(1);
    expect(rodada.estado.fase).toBe('aguardandoDeclaracao');
    expect(rodada.estado.jogadorAtual).toBe(0);
    expect(estadoEmJogo(rodada.estado).cartasPorRodada).toBe(1);
    expect(estadoEmJogo(rodada.estado).declaracoes).toEqual({});
  });

  it('deve rejeitar jogarTurno na fase aguardandoDeclaracao', async () => {
    const emissor = createEmissorEventos();
    const jogadores = jogadoresPadrao();
    const rodada = new Rodada(jogadores, emissor, { jogada: new Map(), declaracao: new Map() });
    rodada.distribuir(1);
    await expect(rodada.jogarTurno()).rejects.toThrow('Não é possível jogar na fase aguardandoDeclaracao');
  });
});

describe('Rodada — declaração — decisor', () => {
  it('deve chamar DecisorDeclaracao para o jogador atual', async () => {
    const emissor = createEmissorEventos();
    const jogadores = [criarJogador('j1', 'J1'), criarJogador('j2', 'J2')];
    const mockDecisor = criarDecisorDeclaracao(1);
    const decisoresDeclaracao = new Map([['j1', mockDecisor]]);
    const rodada = new Rodada(jogadores, emissor, { jogada: new Map(), declaracao: decisoresDeclaracao });
    rodada.distribuir(2);
    await rodada.declarar();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockDecisor.declarar).toHaveBeenCalledTimes(1);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockDecisor.declarar).toHaveBeenCalledWith(rodada.estado, expect.any(Array));
  });
});

describe('Rodada — declaração — estado', () => {
  it('deve armazenar declaracao no estado', async () => {
    const emissor = createEmissorEventos();
    const jogadores = [criarJogador('j1', 'J1'), criarJogador('j2', 'J2')];
    const decisoresDeclaracao = new Map([
      ['j1', criarDecisorDeclaracao(2)],
      ['j2', criarDecisorDeclaracao(0)],
    ]);
    const rodada = new Rodada(jogadores, emissor, { jogada: new Map(), declaracao: decisoresDeclaracao });
    rodada.distribuir(3);
    await rodada.declarar();
    await rodada.declarar();
    expect(estadoEmJogo(rodada.estado).declaracoes).toEqual({ j1: 2, j2: 0 });
  });
});

describe('Rodada — declaração — eventos', () => {
  it('deve emitir evento DECLARACAO_FEITA por jogador', async () => {
    const emissor = createEmissorEventos();
    const handler = vi.fn<(ev: unknown) => void>();
    emissor.on('DECLARACAO_FEITA', handler);
    const jogadores = [criarJogador('j1', 'J1'), criarJogador('j2', 'J2')];
    const decisoresDeclaracao = new Map([
      ['j1', criarDecisorDeclaracao(1)],
      ['j2', criarDecisorDeclaracao(0)],
    ]);
    const rodada = new Rodada(jogadores, emissor, { jogada: new Map(), declaracao: decisoresDeclaracao });
    rodada.distribuir(2);
    await rodada.declarar();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'DECLARACAO_FEITA', jogadorId: 'j1', declarado: 1 }),
    );
    await rodada.declarar();
    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenLastCalledWith(
      expect.objectContaining({ tipo: 'DECLARACAO_FEITA', jogadorId: 'j2', declarado: 0 }),
    );
  });
});

describe('Rodada — declaração — ordem', () => {
  it('deve avancar jogadorAtual em ordem anti-horaria durante declaracao', async () => {
    const emissor = createEmissorEventos();
    const jogadores = [criarJogador('j1', 'J1'), criarJogador('j2', 'J2'), criarJogador('j3', 'J3')];
    const decisoresDeclaracao = new Map([
      ['j1', criarDecisorDeclaracao(1)],
      ['j2', criarDecisorDeclaracao(1)],
      ['j3', criarDecisorDeclaracao(1)],
    ]);
    const rodada = new Rodada(jogadores, emissor, { jogada: new Map(), declaracao: decisoresDeclaracao });
    rodada.distribuir(2);
    expect(rodada.estado.jogadorAtual).toBe(0);
    await rodada.declarar();
    expect(rodada.estado.jogadorAtual).toBe(1);
    await rodada.declarar();
    expect(rodada.estado.jogadorAtual).toBe(2);
  });
});

describe('Rodada — declaração — transicao', () => {
  it('deve transitar para aguardandoJogada apos todos declararem', async () => {
    const emissor = createEmissorEventos();
    const jogadores = [criarJogador('j1', 'J1'), criarJogador('j2', 'J2')];
    const decisoresDeclaracao = new Map([
      ['j1', criarDecisorDeclaracao(1)],
      ['j2', criarDecisorDeclaracao(0)],
    ]);
    const rodada = new Rodada(jogadores, emissor, { jogada: new Map(), declaracao: decisoresDeclaracao });
    rodada.distribuir(2);
    await rodada.declarar();
    expect(rodada.estado.fase).toBe('aguardandoDeclaracao');
    await rodada.declarar();
    expect(rodada.estado.fase).toBe('aguardandoJogada');
    expect(rodada.estado.jogadorAtual).toBe(0);
  });
});

describe('Rodada — declaração — valor zero', () => {
  it('deve permitir declarar 0', async () => {
    const emissor = createEmissorEventos();
    const jogadores = [criarJogador('j1', 'J1')];
    const decisoresDeclaracao = new Map([['j1', criarDecisorDeclaracao(0)]]);
    const rodada = new Rodada(jogadores, emissor, { jogada: new Map(), declaracao: decisoresDeclaracao });
    rodada.distribuir(3);
    await rodada.declarar();
    expect(estadoEmJogo(rodada.estado).declaracoes['j1']).toBe(0);
  });
});

describe('Rodada — declaração — hardening', () => {
  it('deve restaurar fase para aguardandoDeclaracao quando decisor rejeita', async () => {
    const emissor = createEmissorEventos();
    const jogadores = [criarJogador('j1', 'J1')];
    const decisor = { declarar: vi.fn().mockRejectedValue(new Error('Erro do decisor')) };
    const decisoresDeclaracao = new Map([['j1', decisor]]);
    const rodada = new Rodada(jogadores, emissor, { jogada: new Map(), declaracao: decisoresDeclaracao });
    rodada.distribuir(2);
    await expect(rodada.declarar()).rejects.toThrow('Erro do decisor');
    expect(rodada.estado.fase).toBe('aguardandoDeclaracao');
  });

  it('deve restaurar fase quando decisor de declaracao nao eh encontrado', async () => {
    const emissor = createEmissorEventos();
    const jogadores = [criarJogador('j1', 'J1')];
    const rodada = new Rodada(jogadores, emissor, { jogada: new Map(), declaracao: new Map() });
    rodada.distribuir(2);
    await expect(rodada.declarar()).rejects.toThrow('Decisor de declaração não encontrado');
    expect(rodada.estado.fase).toBe('aguardandoDeclaracao');
  });
});

describe('Rodada — declaração — valores invalidos', () => {
  it.each([
    ['negativa', -1],
    ['fracionaria', 1.5],
    ['maior que cartas da rodada', 3],
  ])('deve rejeitar declaracao %s', async (_caso, valor) => {
    const emissor = createEmissorEventos();
    const handler = vi.fn<(ev: unknown) => void>();
    emissor.on('DECLARACAO_FEITA', handler);
    const jogadores = [criarJogador('j1', 'J1')];
    const decisoresDeclaracao = new Map([['j1', criarDecisorDeclaracao(valor)]]);
    const rodada = new Rodada(jogadores, emissor, { jogada: new Map(), declaracao: decisoresDeclaracao });
    rodada.distribuir(2);
    await expect(rodada.declarar()).rejects.toThrow('Declaração inválida');
    expect(rodada.estado.fase).toBe('aguardandoDeclaracao');
    expect(estadoEmJogo(rodada.estado).declaracoes).toEqual({});
    expect(handler).not.toHaveBeenCalled();
  });
});
