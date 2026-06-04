import { describe, expect, it } from 'vitest';
import type { DecisaoDeclaracaoDebug } from '@/adapters/bots/debug-declaracao-bot';
import { DecisorDeclaracaoBot } from '@/adapters/bots/DecisorDeclaracaoBot';
import type { Carta } from '@/core/Carta';
import type { GeradorAleatorio } from '@/core/RngComSeed';
import type { EstadoRodada } from '@/types/estado-rodada';

function criarRng(valores: number[]): GeradorAleatorio {
  let indice = 0;
  return {
    random: () => {
      if (indice >= valores.length) {
        throw new Error(`RNG de teste sem valor na posição ${indice.toString()}`);
      }
      const valor = valores[indice];
      indice += 1;
      return valor;
    },
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
  expect(identificarCartas(decisao.fortesVisiveis)).toEqual(['K♣', 'A♦', 'A♥']);
  expect(identificarCartas(decisao.altasCandidatas)).toEqual(['A♦', 'A♥']);
  expect(identificarCartas(decisao.sorteiosAplicaveis)).toEqual(['A♦']);
  expect(identificarCartas(decisao.sorteiosNaoAplicaveis)).toEqual(['A♥']);
}

describe('Contrato de debug da declaração do bot com sorteios de altas', () => {
  it('deve expor base determinística e separar sorteios aplicáveis dos não aplicáveis', async () => {
    const debug: DecisaoDeclaracaoDebug[] = [];
    const mao = [
      { valor: 'K', naipe: '♣' },
      { valor: 'A', naipe: '♦' },
      { valor: 'A', naipe: '♥' },
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
  it('deve expor fortes visíveis quando a regra especial da primeira rodada zera a declaração', async () => {
    const debug: DecisaoDeclaracaoDebug[] = [];
    const mao = [{ valor: '5', naipe: '♦' }] satisfies Carta[];
    const visiveis = [{ valor: '3', naipe: '♣' }] satisfies Carta[];
    const decisor = new DecisorDeclaracaoBot(0, criarRng([0]), {
      poucasBaixas: 1,
      declaracaoBaixa: 1,
      logger: criarLogger(debug),
    });

    await expect(decisor.declarar(criarEstadoPrimeiraRodada(mao, visiveis), mao)).resolves.toBe(0);

    const decisao = esperarContratoBase(debug);
    expect(decisao).toMatchObject({
      baseDeterministica: 0,
      altasCandidatas: [],
      sorteiosAplicaveis: [],
      sorteiosNaoAplicaveis: [],
      defensivo: { estado: 'não elegível' },
      resultadoFinal: 0,
      regraEspecialPrimeiraRodada: true,
    });
    expect(identificarCartas(decisao.fortesVisiveis)).toEqual(['3♣']);
  });
});

function criarEstadoPrimeiraRodada(mao: Carta[], visiveis: Carta[]): EstadoRodada {
  return {
    fase: 'aguardandoDeclaracao',
    pontos: { humano: 5, bot1: 5, bot2: 5 },
    cartasPorRodada: 1,
    jogadorAtual: 1,
    cartaVirada: { valor: 'Q', naipe: '♦' },
    manilha: 'K',
    maos: [
      { jogador: { id: 'humano', nome: 'Você', pontos: 5 }, cartas: visiveis, visivel: true },
      { jogador: { id: 'bot1', nome: 'Brás', pontos: 5, temperatura: 0.35 }, cartas: mao, visivel: true },
      { jogador: { id: 'bot2', nome: 'Lia', pontos: 5, temperatura: 0.2 }, cartas: [], visivel: true },
    ],
    mesa: [],
    declaracoes: {},
    vazas: {},
    cartasReveladas: visiveis,
    turno: 1,
  };
}
