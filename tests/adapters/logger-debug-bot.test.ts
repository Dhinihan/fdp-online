import { afterEach, describe, expect, it, vi } from 'vitest';
import { DecisorDeclaracaoBot } from '@/adapters/bots/DecisorDeclaracaoBot';
import { criarLoggerDebugBot } from '@/adapters/bots/logger-debug-bot';
import type { Carta } from '@/core/Carta';
import type { GeradorAleatorio } from '@/core/RngComSeed';
import type { EstadoRodada } from '@/types/estado-rodada';

const mao: Carta[] = [
  { valor: '4', naipe: '♦' },
  { valor: '3', naipe: '♣' },
];

function rng(valor: number): GeradorAleatorio {
  return {
    random: vi.fn(() => valor),
    randomInt: vi.fn(() => 0),
    shuffle: <T>(cartas: T[]) => [...cartas],
  };
}

function estado(): EstadoRodada {
  return {
    fase: 'aguardandoDeclaracao',
    pontos: { humano: 5, bot1: 5 },
    cartasPorRodada: 2,
    jogadorAtual: 1,
    cartaVirada: { valor: 'Q', naipe: '♦' },
    manilha: 'K',
    maos: [
      { jogador: { id: 'humano', nome: 'Você', pontos: 5 }, cartas: [], visivel: true },
      { jogador: { id: 'bot1', nome: 'Brás', pontos: 5, temperatura: 0.35 }, cartas: mao, visivel: true },
    ],
    mesa: [],
    declaracoes: {},
    vazas: {},
    cartasReveladas: mao,
    turno: 1,
  };
}

describe('Logger debug dos bots', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deve manter zero logs quando logger não é injetado', async () => {
    const group = vi.spyOn(console, 'groupCollapsed').mockImplementation(() => undefined);
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const decisor = new DecisorDeclaracaoBot(0.35, rng(0.1));

    await decisor.declarar(estado(), mao);

    expect(group).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
  });

  it('deve formatar decisão com groupCollapsed quando modo debug está ativo', async () => {
    const group = vi.spyOn(console, 'groupCollapsed').mockImplementation(() => undefined);
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'groupEnd').mockImplementation(() => undefined);
    const logger = criarLoggerDebugBot('Brás', 0.35);
    const decisor = new DecisorDeclaracaoBot(0.35, rng(0.1), {
      poucasBaixas: 1,
      declaracaoBaixa: 1,
      logger,
    });

    await decisor.declarar(estado(), mao);

    expect(group).toHaveBeenCalledWith('🟡 Brás (T=0.35) — DECLARAÇÃO');
    expect(log).toHaveBeenCalledWith(expect.stringContaining('Mão: ['));
    expect(log).toHaveBeenCalledWith(expect.stringContaining('Seguras:'));
    expect(log).toHaveBeenCalledWith(expect.stringContaining('→ Declarou:'));
  });
});
