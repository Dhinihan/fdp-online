import { describe, expect, it, vi } from 'vitest';
import type { DecisaoJogadaDebug } from '@/adapters/bots/logger-debug-bot';
import { resolverPorTemperatura } from '@/adapters/bots/resolucao-por-temperatura';
import type { Carta } from '@/core/Carta';
import type { EstadoRodada } from '@/types/estado-rodada';
import { criarCarta } from '../core/rodada-fixtures';

describe('resolucao-por-temperatura', () => {
  it('deve jogar a carta sem sortear quando as linhas convergem', linhasIguais);
  it('deve jogar linha quente quando sorteio cai abaixo da temperatura', sorteioEscolheQuente);
  it('deve jogar linha fria quando sorteio não cai abaixo da temperatura', sorteioEscolheFria);
  it('deve manter a recomendação da linha quente independente da temperatura', temperaturaNaoAlteraQuente);
});

function linhasIguais(): void {
  const carta = criarCarta('4', '♦');
  const random = vi.fn(() => 0);
  const jogadas: DecisaoJogadaDebug[] = [];

  const resultado = resolverPorTemperatura({
    temperatura: 1,
    rng: { random },
    mao: [carta],
    estado: criarEstado(),
    fria: recomendacao(carta, 'fria'),
    quente: recomendacao(carta, 'quente'),
    logger: loggerCapturador(jogadas),
  });

  expect(resultado).toEqual(carta);
  expect(random).not.toHaveBeenCalled();
  expect(jogadas[0]).toMatchObject({ carta, escolheuQuente: false });
  expect(jogadas[0]?.sorteio).toBeUndefined();
}

function sorteioEscolheQuente(): void {
  const fria = criarCarta('3', '♦');
  const quente = criarCarta('4', '♦');
  const jogadas: DecisaoJogadaDebug[] = [];

  const resultado = resolverPorTemperatura({
    temperatura: 0.5,
    rng: { random: () => 0.2 },
    mao: [fria, quente],
    estado: criarEstado(),
    fria: recomendacao(fria, 'fria'),
    quente: recomendacao(quente, 'quente'),
    logger: loggerCapturador(jogadas),
  });

  expect(resultado).toEqual(quente);
  expect(jogadas[0]).toMatchObject({ carta: quente, escolheuQuente: true, sorteio: 0.2 });
}

function sorteioEscolheFria(): void {
  const fria = criarCarta('3', '♦');
  const quente = criarCarta('4', '♦');
  const jogadas: DecisaoJogadaDebug[] = [];

  const resultado = resolverPorTemperatura({
    temperatura: 0.5,
    rng: { random: () => 0.8 },
    mao: [fria, quente],
    estado: criarEstado(),
    fria: recomendacao(fria, 'fria'),
    quente: recomendacao(quente, 'quente'),
    logger: loggerCapturador(jogadas),
  });

  expect(resultado).toEqual(fria);
  expect(jogadas[0]).toMatchObject({ carta: fria, escolheuQuente: false, sorteio: 0.8 });
}

function temperaturaNaoAlteraQuente(): void {
  const fria = criarCarta('3', '♦');
  const quente = criarCarta('4', '♦');
  const recomendacaoQuente = recomendacao(quente, 'pressão: vencedora barata');
  const configBase = {
    mao: [fria, quente],
    estado: criarEstado(),
    fria: recomendacao(fria, 'fria'),
    quente: recomendacaoQuente,
  };

  const comTemperaturaZero = resolverComTemperatura(0, 0.5, configBase);
  const comTemperaturaUm = resolverComTemperatura(1, 0.5, configBase);

  expect(comTemperaturaZero.jogadas[0]?.quente).toEqual(comTemperaturaUm.jogadas[0]?.quente);
  expect(comTemperaturaZero.jogadas[0]?.motivoLinhaQuente).toBe(comTemperaturaUm.jogadas[0]?.motivoLinhaQuente);
}

function resolverComTemperatura(
  temperatura: number,
  sorteio: number,
  config: Omit<Parameters<typeof resolverPorTemperatura>[0], 'temperatura' | 'rng' | 'logger'>,
) {
  const jogadas: DecisaoJogadaDebug[] = [];
  const carta = resolverPorTemperatura({
    ...config,
    temperatura,
    rng: { random: () => sorteio },
    logger: loggerCapturador(jogadas),
  });
  return { carta, jogadas };
}

function recomendacao(carta: Carta, motivo: string) {
  return { carta, motivo, caminho: ['jogada', motivo] };
}

function loggerCapturador(jogadas: DecisaoJogadaDebug[]) {
  return {
    registrarDeclaracao: () => undefined,
    registrarJogada: (jogada: DecisaoJogadaDebug) => jogadas.push(jogada),
  };
}

function criarEstado(): EstadoRodada {
  return {
    fase: 'aguardandoJogada',
    pontos: { bot: 5 },
    cartasPorRodada: 2,
    jogadorAtual: 0,
    cartaVirada: null,
    manilha: '5',
    maos: [{ jogador: { id: 'bot', nome: 'Bot', pontos: 5 }, cartas: [], visivel: true }],
    mesa: [],
    declaracoes: { bot: 1 },
    vazas: { bot: 0 },
    cartasReveladas: [],
    turno: 1,
  };
}
