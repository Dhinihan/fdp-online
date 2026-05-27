import { describe, expect, it } from 'vitest';
import type { DecisaoDeclaracaoDebug } from '@/adapters/bots/debug-declaracao-bot';
import { DecisorDeclaracaoBot } from '@/adapters/bots/DecisorDeclaracaoBot';
import type { Carta } from '@/core/Carta';
import type { GeradorAleatorio } from '@/core/RngComSeed';
import type { EstadoRodada } from '@/types/estado-rodada';

function criarRng(valores: number[]): GeradorAleatorio {
  let indice = 0;
  return {
    random: () => valores[indice++] ?? 0,
    randomInt: (min: number) => min,
    shuffle: <T>(array: T[]) => [...array],
  };
}

function criarEstado(mao: Carta[], cartasPorRodada = mao.length): EstadoRodada {
  return {
    fase: 'aguardandoDeclaracao',
    pontos: { humano: 5, bot1: 5 },
    cartasPorRodada,
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
    cartasReveladas: [],
    turno: 1,
  };
}

function identificarCartas(avaliadas: { carta: Carta }[]): string[] {
  return avaliadas.map(({ carta }) => `${carta.valor}${carta.naipe}`);
}

function criarLogger(debug: DecisaoDeclaracaoDebug[]) {
  return {
    registrarDeclaracao: (decisao: DecisaoDeclaracaoDebug) => debug.push(decisao),
    registrarJogada: () => undefined,
  };
}

function esperarContratoBase(debug: DecisaoDeclaracaoDebug[]): DecisaoDeclaracaoDebug {
  expect(debug).toHaveLength(1);
  return debug[0];
}

function esperarDeclaracaoComSorteios(decisao: DecisaoDeclaracaoDebug): void {
  expect(decisao).toMatchObject({
    baseDeterministica: 1,
    defensivo: { estado: 'não elegível' },
    resultadoFinal: 2,
    regraEspecialPrimeiraRodada: false,
  });
  expect(identificarCartas(decisao.altasCandidatas)).toEqual(['2♦', '2♥']);
  expect(identificarCartas(decisao.sorteiosAplicaveis)).toEqual(['2♦']);
  expect(identificarCartas(decisao.sorteiosNaoAplicaveis)).toEqual(['2♥']);
}

describe('Contrato de debug da declaração do bot com sorteios de altas', () => {
  it('deve expor base determinística e separar sorteios aplicáveis dos não aplicáveis', async () => {
    const debug: DecisaoDeclaracaoDebug[] = [];
    const mao = [
      { valor: '3', naipe: '♣' },
      { valor: '2', naipe: '♦' },
      { valor: '2', naipe: '♥' },
      { valor: '4', naipe: '♦' },
    ] satisfies Carta[];
    const decisor = new DecisorDeclaracaoBot(0.5, criarRng([0.1, 0.9]), {
      poucasBaixas: 1,
      declaracaoBaixa: 1,
      logger: criarLogger(debug),
    });

    await expect(decisor.declarar(criarEstado(mao), mao)).resolves.toBe(2);

    esperarDeclaracaoComSorteios(esperarContratoBase(debug));
  });
});

describe('Contrato de debug da declaração do bot na primeira rodada', () => {
  it('deve manter o contrato mínimo também na regra especial da primeira rodada', async () => {
    const debug: DecisaoDeclaracaoDebug[] = [];
    const mao = [{ valor: '4', naipe: '♣' }] satisfies Carta[];
    const decisor = new DecisorDeclaracaoBot(0, criarRng([0]), {
      poucasBaixas: 1,
      declaracaoBaixa: 1,
      logger: criarLogger(debug),
    });

    await expect(decisor.declarar(criarEstado(mao, 1), mao)).resolves.toBe(1);

    expect(esperarContratoBase(debug)).toMatchObject({
      baseDeterministica: 0,
      sorteiosAplicaveis: [],
      sorteiosNaoAplicaveis: [],
      defensivo: { estado: 'não elegível' },
      resultadoFinal: 1,
      regraEspecialPrimeiraRodada: true,
    });
  });
});
