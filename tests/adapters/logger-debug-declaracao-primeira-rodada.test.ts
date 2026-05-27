import { afterEach, describe, expect, it, vi } from 'vitest';
import { DecisorDeclaracaoBot } from '@/adapters/bots/DecisorDeclaracaoBot';
import { criarLoggerDebugBot } from '@/adapters/bots/logger-debug-bot';
import type { Carta } from '@/core/Carta';
import type { GeradorAleatorio } from '@/core/RngComSeed';
import type { EstadoRodada } from '@/types/estado-rodada';

function rng(valor: number): GeradorAleatorio {
  return {
    random: vi.fn(() => valor),
    randomInt: vi.fn(() => 0),
    shuffle: <T>(cartas: T[]) => [...cartas],
  };
}

function estadoPrimeiraRodada(): EstadoRodada {
  return {
    fase: 'aguardandoDeclaracao',
    pontos: { humano: 5, bot1: 5, bot2: 5 },
    cartasPorRodada: 1,
    jogadorAtual: 1,
    cartaVirada: { valor: 'Q', naipe: '♦' },
    manilha: 'K',
    maos: [
      { jogador: { id: 'humano', nome: 'Você', pontos: 5 }, cartas: [{ valor: '3', naipe: '♣' }], visivel: true },
      {
        jogador: { id: 'bot1', nome: 'Brás', pontos: 5, temperatura: 0.35 },
        cartas: [{ valor: '5', naipe: '♦' }],
        visivel: true,
      },
      { jogador: { id: 'bot2', nome: 'Lia', pontos: 5, temperatura: 0.2 }, cartas: [], visivel: true },
    ],
    mesa: [],
    declaracoes: {},
    vazas: {},
    cartasReveladas: [{ valor: '3', naipe: '♣' }],
    turno: 1,
  };
}

describe('Logger debug da declaração dos bots na primeira rodada', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deve destacar fortes visíveis na regra especial', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'groupCollapsed').mockImplementation(() => undefined);
    vi.spyOn(console, 'groupEnd').mockImplementation(() => undefined);
    const logger = criarLoggerDebugBot('Brás', 0.35);
    const decisor = new DecisorDeclaracaoBot(0.35, rng(0.1), {
      poucasBaixas: 1,
      declaracaoBaixa: 1,
      logger,
    });
    const mao: Carta[] = [{ valor: '5', naipe: '♦' }];

    await decisor.declarar(estadoPrimeiraRodada(), mao);

    expect(log).toHaveBeenCalledWith('Regra especial N=1: própria carta oculta não entrou no cálculo');
    expect(log).toHaveBeenCalledWith(expect.stringContaining('Fortes visíveis: [3♣ segura] (1)'));
    expect(log).toHaveBeenCalledWith(expect.stringContaining('Resultado final: 0'));
  });
});
