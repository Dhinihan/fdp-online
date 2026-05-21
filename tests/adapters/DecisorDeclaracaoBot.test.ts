import { describe, expect, it } from 'vitest';
import { DecisorDeclaracaoBot } from '@/adapters/bots/DecisorDeclaracaoBot';
import type { Carta } from '@/core/Carta';
import { RngComSeed, type GeradorAleatorio } from '@/core/RngComSeed';
import type { EstadoRodada } from '@/types/estado-rodada';
import { criarCarta, criarJogador } from '../core/rodada-fixtures';

function criarEstado(mao: Carta[], cartasReveladas: Carta[] = [], cartasPorRodada = mao.length): EstadoRodada {
  const jogador = criarJogador('bot1', 'Bot 1');
  return {
    fase: 'aguardandoDeclaracao',
    jogadorAtual: 0,
    pontos: { bot1: 5, bot2: 5, bot3: 5, bot4: 5 },
    maos: [
      { jogador, cartas: mao, visivel: true },
      { jogador: criarJogador('humano', 'Humano'), cartas: cartasReveladas, visivel: true },
      { jogador: criarJogador('bot3', 'Bot 3'), cartas: [], visivel: true },
      { jogador: criarJogador('bot4', 'Bot 4'), cartas: [], visivel: true },
    ],
    cartasPorRodada,
    manilha: '4',
    cartaVirada: null,
    declaracoes: {},
    mesa: [],
    cartasReveladas,
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

    await expect(decisor.declarar(criarEstado(maoForte), maoForte)).resolves.toBe(3);
  });

  it('deve produzir resultado determinístico com seed fixa', async () => {
    const mao = [...maoForte, criarCarta('K', '♦'), criarCarta('Q', '♠')];
    const primeiro = new DecisorDeclaracaoBot(0.5, new RngComSeed(154));
    const segundo = new DecisorDeclaracaoBot(0.5, new RngComSeed(154));

    await expect(primeiro.declarar(criarEstado(mao), mao)).resolves.toBe(await segundo.declarar(criarEstado(mao), mao));
  });
});

describe('DecisorDeclaracaoBot na primeira rodada', () => {
  it('deve ignorar carta própria forte oculta e declarar 1 sem altas visíveis', async () => {
    const mao = [criarCarta('4', '♣')];
    const decisor = new DecisorDeclaracaoBot(0, criarRng([0]));

    await expect(decisor.declarar(criarEstado(mao, [], 1), mao)).resolves.toBe(1);
  });

  it('deve declarar 0 quando vê carta alta de outro jogador', async () => {
    const mao = [criarCarta('5', '♦')];
    const visiveis = [criarCarta('3', '♣')];
    const decisor = new DecisorDeclaracaoBot(1, criarRng([0]));

    await expect(decisor.declarar(criarEstado(mao, visiveis, 1), mao)).resolves.toBe(0);
  });

  it('deve considerar carta forte do humano mesmo quando a UI oculta sua mão', async () => {
    const mao = [criarCarta('5', '♦')];
    const decisor = new DecisorDeclaracaoBot(1, criarRng([0]));

    await expect(decisor.declarar(criarEstadoComHumanoOculto(mao, [criarCarta('3', '♣')]), mao)).resolves.toBe(0);
  });

  it('deve declarar 1 quando não vê cartas altas de outros jogadores', async () => {
    const mao = [criarCarta('5', '♦')];
    const visiveis = [criarCarta('6', '♦')];
    const decisor = new DecisorDeclaracaoBot(1, criarRng([0]));

    await expect(decisor.declarar(criarEstado(mao, visiveis, 1), mao)).resolves.toBe(1);
  });

  it('deve avaliar cada carta visível como N=1', async () => {
    const mao = [criarCarta('5', '♦')];
    const visiveis = [criarCarta('3', '♦'), criarCarta('6', '♦'), criarCarta('7', '♦')];
    const decisor = new DecisorDeclaracaoBot(1, criarRng([0]));

    await expect(decisor.declarar(criarEstado(mao, visiveis, 1), mao)).resolves.toBe(0);
  });
});

describe('DecisorDeclaracaoBot com cartas reveladas', () => {
  it('não deve usar cartas visíveis da mão humana para declarar', async () => {
    const mao = [criarCarta('Q', '♣')];
    const cartasHumanas = criarCartasHumanasVisiveis();
    const decisorComCartasHumanas = new DecisorDeclaracaoBot(0, criarRng([0]));
    const decisorSemCartasHumanas = new DecisorDeclaracaoBot(0, criarRng([0]));

    await expect(decisorComCartasHumanas.declarar(criarEstado(mao, cartasHumanas, 2), mao)).resolves.toBe(
      await decisorSemCartasHumanas.declarar(criarEstado(mao, [], 2), mao),
    );
  });
});

describe('DecisorDeclaracaoBot com altas candidatas', () => {
  it('deve sortear cada carta alta individualmente e respeitar o parcial', async () => {
    const mao = [
      criarCarta('3', '♣'),
      criarCarta('3', '♥'),
      criarCarta('3', '♠'),
      criarCarta('3', '♦'),
      criarCarta('6', '♦'),
    ];
    const decisor = new DecisorDeclaracaoBot(0.5, criarRng([0.1, 0.9, 0.2, 0.8, 0.9]));

    await expect(decisor.declarar(criarEstado(mao), mao)).resolves.toBe(2);
  });
});

describe('DecisorDeclaracaoBot com limites', () => {
  it('deve bloquear defensivo quando N=2 passaria do teto', async () => {
    const mao = [criarCarta('3', '♣'), criarCarta('Q', '♣')];
    const decisor = new DecisorDeclaracaoBot(0, criarRng([0, 0]));

    await expect(decisor.declarar(criarEstado(mao), mao)).resolves.toBe(1);
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

describe('DecisorDeclaracaoBot com teto defensivo', () => {
  it('não deve aplicar defensivo em N=1', async () => {
    const mao = [criarCarta('6', '♦')];
    const decisor = new DecisorDeclaracaoBot(0, criarRng([0]));

    await expect(decisor.declarar(criarEstado(mao, [], 1), mao)).resolves.toBe(1);
  });

  it('deve bloquear defensivo em N=2 quando passaria do teto', async () => {
    const mao = [criarCarta('3', '♣'), criarCarta('6', '♦')];
    const decisor = new DecisorDeclaracaoBot(0, criarRng([0]));

    await expect(decisor.declarar(criarEstado(mao), mao)).resolves.toBe(1);
  });

  it('deve bloquear defensivo em N=3 quando passaria do teto', async () => {
    const mao = [criarCarta('3', '♣'), criarCarta('6', '♦'), criarCarta('7', '♦')];
    const decisor = new DecisorDeclaracaoBot(0, criarRng([0]));

    await expect(decisor.declarar(criarEstado(mao), mao)).resolves.toBe(1);
  });

  it('deve permitir defensivo em N=4 quando respeita o teto', async () => {
    const mao = [criarCarta('3', '♣'), criarCarta('K', '♦'), criarCarta('Q', '♦'), criarCarta('J', '♦')];
    const decisor = new DecisorDeclaracaoBot(0, criarRng([0]));

    await expect(decisor.declarar(criarEstado(mao), mao)).resolves.toBe(2);
  });
});

function criarCartasHumanasVisiveis(): Carta[] {
  return [
    criarCarta('4', '♣'),
    criarCarta('3', '♣'),
    criarCarta('3', '♥'),
    criarCarta('3', '♠'),
    criarCarta('3', '♦'),
    criarCarta('2', '♣'),
  ];
}

function criarEstadoComHumanoOculto(mao: Carta[], cartasHumanas: Carta[]): EstadoRodada {
  const jogador = criarJogador('bot1', 'Bot 1');
  return {
    fase: 'aguardandoDeclaracao',
    jogadorAtual: 0,
    pontos: { bot1: 5, humano: 5, bot3: 5, bot4: 5 },
    maos: [
      { jogador, cartas: mao, visivel: true },
      { jogador: criarJogador('humano', 'Humano'), cartas: cartasHumanas, visivel: false },
      { jogador: criarJogador('bot3', 'Bot 3'), cartas: [], visivel: true },
      { jogador: criarJogador('bot4', 'Bot 4'), cartas: [], visivel: true },
    ],
    cartasPorRodada: 1,
    manilha: '4',
    cartaVirada: null,
    declaracoes: {},
    mesa: [],
    cartasReveladas: [],
    vazas: {},
    turno: 0,
  };
}
