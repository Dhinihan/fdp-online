import { describe, expect, it } from 'vitest';
import { DecisorDeclaracaoBot } from '@/adapters/bots/DecisorDeclaracaoBot';
import type { Carta } from '@/core/Carta';
import { RngComSeed, type GeradorAleatorio } from '@/core/RngComSeed';
import type { EstadoRodada } from '@/types/estado-rodada';
import { criarCarta, criarJogador } from '../core/rodada-fixtures';

function criarEstado(mao: Carta[]): EstadoRodada {
  const jogador = criarJogador('bot1', 'Bot 1');
  return {
    fase: 'aguardandoDeclaracao',
    jogadorAtual: 0,
    pontos: { bot1: 5, bot2: 5, bot3: 5, bot4: 5 },
    maos: [
      { jogador, cartas: mao, visivel: true },
      { jogador: criarJogador('bot2', 'Bot 2'), cartas: [], visivel: true },
      { jogador: criarJogador('bot3', 'Bot 3'), cartas: [], visivel: true },
      { jogador: criarJogador('bot4', 'Bot 4'), cartas: [], visivel: true },
    ],
    cartasPorRodada: mao.length,
    manilha: '4',
    cartaVirada: null,
    declaracoes: {},
    mesa: [],
    cartasReveladas: [],
    vazas: {},
    turno: 0,
  };
}

function criarRng(valores: number[]): GeradorAleatorio {
  let indice = 0;
  return {
    random: () => valores[indice++] ?? 0,
    randomInt: (min: number) => min,
    shuffle: <T>(array: T[]) => [...array],
  };
}

describe('DecisorDeclaracaoBot', () => {
  const maoForte = [criarCarta('4', '♣'), criarCarta('4', '♣'), criarCarta('3', '♣'), criarCarta('2', '♥')];

  it('deve declarar seguras e altas para bot frio', async () => {
    const decisor = new DecisorDeclaracaoBot(0, criarRng([0, 0]));

    await expect(decisor.declarar(criarEstado(maoForte), maoForte)).resolves.toBe(4);
  });

  it('deve declarar apenas seguras para bot quente', async () => {
    const decisor = new DecisorDeclaracaoBot(1, criarRng([0, 0]));

    await expect(decisor.declarar(criarEstado(maoForte), maoForte)).resolves.toBe(2);
  });

  it('deve produzir resultado determinístico com seed fixa', async () => {
    const mao = [...maoForte, criarCarta('K', '♦'), criarCarta('Q', '♠')];
    const primeiro = new DecisorDeclaracaoBot(0.5, new RngComSeed(154));
    const segundo = new DecisorDeclaracaoBot(0.5, new RngComSeed(154));

    await expect(primeiro.declarar(criarEstado(mao), mao)).resolves.toBe(await segundo.declarar(criarEstado(mao), mao));
  });
});

describe('DecisorDeclaracaoBot com limites', () => {
  it('deve somar um defensivo quando tem poucas baixas e declaração baixa', async () => {
    const mao = [criarCarta('3', '♣'), criarCarta('Q', '♣')];
    const decisor = new DecisorDeclaracaoBot(0, criarRng([0, 0]));

    await expect(decisor.declarar(criarEstado(mao), mao)).resolves.toBe(2);
  });

  it('não deve exceder o número de cartas da rodada', async () => {
    const maoForte = [criarCarta('4', '♣'), criarCarta('4', '♣'), criarCarta('3', '♣'), criarCarta('2', '♥')];
    const decisor = new DecisorDeclaracaoBot(0, criarRng([0, 0, 0]));

    await expect(decisor.declarar(criarEstado(maoForte), maoForte)).resolves.toBe(4);
  });

  it('não deve declarar valor negativo', async () => {
    const mao = [criarCarta('5', '♦'), criarCarta('6', '♠')];
    const decisor = new DecisorDeclaracaoBot(1, criarRng([0]));

    await expect(decisor.declarar(criarEstado(mao), mao)).resolves.toBe(0);
  });
});
