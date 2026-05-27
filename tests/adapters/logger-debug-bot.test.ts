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

function estadoJogada(): EstadoRodada {
  const rodada = estado();
  if (rodada.fase !== 'aguardandoDeclaracao') return rodada;
  return { ...rodada, fase: 'aguardandoJogada' };
}

function registrarJogadaDireta(): void {
  criarLoggerDebugBot('Brás', 0.35).registrarJogada({
    estado: estadoJogada(),
    mao,
    linhaFria: mao[0],
    linhaQuente: mao[0],
    carta: mao[0],
    escolheuQuente: false,
    motivoSemBifurcacao: 'sem bifurcação: fuga impossível',
  });
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
});

describe('Logger debug da declaração dos bots', () => {
  afterEach(() => {
    vi.restoreAllMocks();
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
    expect(log).toHaveBeenCalledWith(expect.stringContaining('Base determinística:'));
    expect(log).toHaveBeenCalledWith(expect.stringContaining('Altas candidatas:'));
    expect(log).toHaveBeenCalledWith(expect.stringContaining('Sorteios aplicáveis:'));
    expect(log).toHaveBeenCalledWith(expect.stringContaining('Sorteios não aplicáveis:'));
    expect(log).toHaveBeenCalledWith(expect.stringContaining('Resultado final:'));
    expect(log).toHaveBeenCalledWith(expect.stringContaining('→ Declarou:'));
  });
});

describe('Logger debug das jogadas dos bots', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deve registrar sem sorteio quando as linhas escolhem a mesma carta', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'groupCollapsed').mockImplementation(() => undefined);
    vi.spyOn(console, 'groupEnd').mockImplementation(() => undefined);
    registrarJogadaDireta();

    expect(log).toHaveBeenCalledWith('Sorteio por temperatura: não ocorreu');
  });

  it('deve registrar bifurcação ausente com motivo em escolhas diretas', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'groupCollapsed').mockImplementation(() => undefined);
    vi.spyOn(console, 'groupEnd').mockImplementation(() => undefined);
    registrarJogadaDireta();

    expect(log).toHaveBeenCalledWith('Bifurcação: não ocorreu | sem bifurcação: fuga impossível');
  });

  it('deve registrar sorteio por temperatura sem chamar de determinístico', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'groupCollapsed').mockImplementation(() => undefined);
    vi.spyOn(console, 'groupEnd').mockImplementation(() => undefined);

    registrarJogadaComBifurcacao();

    expect(log).toHaveBeenCalledWith('Bifurcação: ocorreu | fria 4♦ | quente 3♣');
    expect(log).toHaveBeenCalledWith('Sorteio por temperatura: linha quente (0.10 < T=0.35? sim → linha quente)');
    expect(log).not.toHaveBeenCalledWith(expect.stringContaining('determinística'));
  });
});

describe('Logger debug motivo ausente na jogada', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deve exibir motivo não registrado quando linha chega sem motivo', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'groupCollapsed').mockImplementation(() => undefined);
    vi.spyOn(console, 'groupEnd').mockImplementation(() => undefined);

    criarLoggerDebugBot('Brás', 0.35).registrarJogada({
      estado: estadoJogada(),
      mao,
      linhaFria: mao[0],
      linhaQuente: mao[1],
      carta: mao[0],
      escolheuQuente: false,
    });

    expect(log).toHaveBeenCalledWith(expect.stringContaining('Linha fria: jogar 4♦ (motivo não registrado)'));
    expect(log).toHaveBeenCalledWith(expect.stringContaining('Linha quente: jogar 3♣ (motivo não registrado)'));
  });
});

function registrarJogadaComBifurcacao(): void {
  criarLoggerDebugBot('Brás', 0.35).registrarJogada({
    estado: estadoJogada(),
    mao,
    linhaFria: mao[0],
    linhaQuente: mao[1],
    carta: mao[1],
    escolheuQuente: true,
    sorteio: 0.1,
  });
}
