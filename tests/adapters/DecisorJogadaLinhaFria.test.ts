import { describe, expect, it } from 'vitest';
import { DecisorJogadaLinhaFria, decidirUltimoLinhaFria } from '@/adapters/bots/DecisorJogadaLinhaFria';
import { lerMesa } from '@/adapters/bots/ler-mesa';
import type { Carta } from '@/core/Carta';
import type { EstadoEmJogo } from '@/types/estado-rodada';
import { criarCarta } from '../core/rodada-fixtures';
import {
  cartasQueGarantemTresDeOuros,
  criarEstadoLinhaFria,
  ETAPA_FECHA_JA_CUMPRIU,
  ETAPA_FECHA_PRECISA,
  mesaComK,
  mesaComQuatro,
} from './fixtures-linha-fria';

const cenariosDeUltimo: {
  nome: string;
  mao: Carta[];
  estado: EstadoEmJogo;
  esperado: { carta: Carta; motivo: string; etapa: string };
}[] = [
  {
    nome: 'deve escolher G[N-X] no último quando precisa fazer e tem ganhadoras',
    mao: [criarCarta('5', '♦'), criarCarta('8', '♦'), criarCarta('K', '♦')],
    estado: criarEstadoLinhaFria({ mesa: mesaComQuatro(), declaracoes: { bot: 2 }, vazas: { bot: 0 }, manilha: '6' }),
    esperado: {
      carta: criarCarta('8', '♦'),
      motivo: 'precisa fazer; regra G[N-X]',
      etapa: ETAPA_FECHA_PRECISA,
    },
  },
  {
    nome: 'deve escolher P[N-X] no último quando precisa fazer sem carta que vence',
    mao: [criarCarta('4', '♦'), criarCarta('6', '♦'), criarCarta('9', '♦'), criarCarta('Q', '♦')],
    estado: criarEstadoLinhaFria({ mesa: mesaComK(), declaracoes: { bot: 2 }, vazas: { bot: 0 }, manilha: '5' }),
    esperado: {
      carta: criarCarta('9', '♦'),
      motivo: 'precisa fazer sem carta que vence; regra P[N-X]',
      etapa: ETAPA_FECHA_PRECISA,
    },
  },
  {
    nome: 'deve fugir no último com a carta mais forte que não faz quando já cumpriu',
    mao: [criarCarta('Q', '♦'), criarCarta('K', '♦')],
    estado: criarEstadoLinhaFria({ mesa: mesaComK(), declaracoes: { bot: 1 }, vazas: { bot: 1 }, manilha: '5' }),
    esperado: {
      carta: criarCarta('K', '♦'),
      motivo: 'já cumpriu; carta mais forte que não faz',
      etapa: ETAPA_FECHA_JA_CUMPRIU,
    },
  },
  {
    nome: 'deve tratar empate como carta que não faz no último quando já cumpriu',
    mao: [criarCarta('K', '♦'), criarCarta('A', '♦')],
    estado: criarEstadoLinhaFria({
      mesa: [{ jogadorId: 'j1', carta: criarCarta('K', '♣') }],
      declaracoes: { bot: 1 },
      vazas: { bot: 1 },
    }),
    esperado: {
      carta: criarCarta('K', '♦'),
      motivo: 'já cumpriu; carta mais forte que não faz',
      etapa: ETAPA_FECHA_JA_CUMPRIU,
    },
  },
  {
    nome: 'deve jogar a carta mais alta no último quando fuga é impossível',
    mao: [criarCarta('5', '♦'), criarCarta('8', '♦'), criarCarta('K', '♦')],
    estado: criarEstadoLinhaFria({ mesa: mesaComQuatro(), declaracoes: { bot: 1 }, vazas: { bot: 1 }, manilha: '6' }),
    esperado: {
      carta: criarCarta('K', '♦'),
      motivo: 'já cumpriu; fuga impossível',
      etapa: ETAPA_FECHA_JA_CUMPRIU,
    },
  },
];

describe('DecisorJogadaLinhaFria', () => {
  it('deve escolher G[N-X] quando precisa fazer e tem ganhadoras suficientes', deveEscolherGanhadoraPorNecessidade);
  it('deve escolher a ganhadora mais fraca quando ganhadoras são escassas', deveEscolherGanhadoraEscassa);
  it('deve escolher P[N-X] quando precisa fazer mas não consegue agora', deveEscolherPerdedoraPorNecessidade);
  it('deve escolher a perdedora mais fraca quando todas são candidatas futuras', deveEscolherPerdedoraEscassa);
  it('não deve tratar empate como carta que faz a vaza', deveRejeitarEmpateComoVitoria);
  it('deve ordenar ganhadoras por força real com manilha e desempate por naipe', deveOrdenarPorForcaReal);
  it.each(cenariosDeUltimo)('$nome', ({ mao, estado, esperado }) => {
    expect(decidirUltimoLinhaFria(lerMesa(estado, mao), estado)).toEqual(esperado);
  });
  it('deve fazer sem desperdiçar carta garantida quando ainda não é o último', devePreservarGarantida);
  it('deve seguir fuga do fim sem considerar necessidade do líder', deveIgnorarNecessidadeDoLiderNoFim);
  it('deve decidir abertura cautelosamente quando a mesa está vazia', deveDecidirAbertura);
});

async function deveEscolherGanhadoraPorNecessidade(): Promise<void> {
  const estado = criarEstadoLinhaFria({
    mesa: mesaComQuatro(),
    declaracoes: { bot: 2 },
    vazas: { bot: 0 },
    manilha: '6',
  });
  const bot = new DecisorJogadaLinhaFria();
  await expect(
    bot.decidirJogada([criarCarta('5', '♦'), criarCarta('8', '♦'), criarCarta('K', '♦')], estado),
  ).resolves.toEqual(criarCarta('8', '♦'));
}

async function deveEscolherGanhadoraEscassa(): Promise<void> {
  const estado = criarEstadoLinhaFria({
    mesa: mesaComQuatro(),
    declaracoes: { bot: 4 },
    vazas: { bot: 0 },
    manilha: '6',
  });
  const bot = new DecisorJogadaLinhaFria();
  await expect(
    bot.decidirJogada([criarCarta('5', '♦'), criarCarta('8', '♦'), criarCarta('K', '♦')], estado),
  ).resolves.toEqual(criarCarta('5', '♦'));
}

async function deveEscolherPerdedoraPorNecessidade(): Promise<void> {
  const estado = criarEstadoLinhaFria({ mesa: mesaComK(), declaracoes: { bot: 2 }, vazas: { bot: 0 }, manilha: '5' });
  const bot = new DecisorJogadaLinhaFria();
  await expect(
    bot.decidirJogada([criarCarta('4', '♦'), criarCarta('6', '♦'), criarCarta('9', '♦'), criarCarta('Q', '♦')], estado),
  ).resolves.toEqual(criarCarta('9', '♦'));
}

async function deveEscolherPerdedoraEscassa(): Promise<void> {
  const estado = criarEstadoLinhaFria({ mesa: mesaComK(), declaracoes: { bot: 2 }, vazas: { bot: 0 }, manilha: '5' });
  const bot = new DecisorJogadaLinhaFria();
  await expect(bot.decidirJogada([criarCarta('4', '♦'), criarCarta('6', '♦')], estado)).resolves.toEqual(
    criarCarta('4', '♦'),
  );
}

async function deveRejeitarEmpateComoVitoria(): Promise<void> {
  const estado = criarEstadoLinhaFria({
    mesa: [{ jogadorId: 'j1', carta: criarCarta('K', '♣') }],
    declaracoes: { bot: 1 },
    vazas: { bot: 0 },
    manilha: '5',
  });
  const bot = new DecisorJogadaLinhaFria();
  await expect(bot.decidirJogada([criarCarta('K', '♦'), criarCarta('A', '♦')], estado)).resolves.toEqual(
    criarCarta('A', '♦'),
  );
}

async function deveOrdenarPorForcaReal(): Promise<void> {
  const estado = criarEstadoLinhaFria({ mesa: mesaComK(), declaracoes: { bot: 1 }, vazas: { bot: 0 }, manilha: '5' });
  const bot = new DecisorJogadaLinhaFria();
  await expect(bot.decidirJogada([criarCarta('5', '♦'), criarCarta('5', '♣')], estado)).resolves.toEqual(
    criarCarta('5', '♣'),
  );
}

async function devePreservarGarantida(): Promise<void> {
  const estado = criarEstadoLinhaFria(cenarioGarantida());
  const bot = new DecisorJogadaLinhaFria();
  await expect(bot.decidirJogada([criarCarta('6', '♦'), criarCarta('3', '♦')], estado)).resolves.toEqual(
    criarCarta('6', '♦'),
  );
}

async function deveIgnorarNecessidadeDoLiderNoFim(): Promise<void> {
  const estado = criarEstadoLinhaFria({ mesa: mesaComK(), declaracoes: { j1: 1, bot: 0 }, vazas: { j1: 0, bot: 0 } });
  const bot = new DecisorJogadaLinhaFria();
  await expect(bot.decidirJogada([criarCarta('4', '♦'), criarCarta('Q', '♠')], estado)).resolves.toEqual(
    criarCarta('Q', '♠'),
  );
}

function cenarioGarantida(): Partial<EstadoEmJogo> {
  return {
    mesa: [{ jogadorId: 'j1', carta: criarCarta('5', '♣') }],
    jogadorAtual: 1,
    declaracoes: { bot: 1 },
    vazas: { bot: 0 },
    manilha: '4',
    cartasReveladas: cartasQueGarantemTresDeOuros(),
  };
}

async function deveDecidirAbertura(): Promise<void> {
  const estado = criarEstadoLinhaFria({
    mesa: [],
    declaracoes: { bot: 0 },
    vazas: { bot: 0 },
    cartasReveladas: cartasQueGarantemTresDeOuros(),
  });
  const bot = new DecisorJogadaLinhaFria();
  const mao = [criarCarta('3', '♦'), criarCarta('8', '♦')];
  await expect(bot.decidirJogada(mao, estado)).resolves.toEqual(criarCarta('8', '♦'));
}
