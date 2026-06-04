import { describe, expect, it } from 'vitest';
import {
  descartePorNecessidade,
  escolherVencedoraPorNecessidade,
  ordenarPorForcaReal,
} from '@/adapters/bots/escolhas-por-necessidade';
import type { CartaAvaliada } from '@/core/avaliador-carta';
import type { Carta } from '@/core/Carta';
import { criarCarta } from '../core/rodada-fixtures';

describe('escolhas por necessidade', () => {
  it('deve escolher vencedora pelo índice canônico quando há cartas suficientes', deveEscolherVencedoraPorIndice);
  it('deve escolher a vencedora mais fraca quando vencedoras são escassas', deveEscolherVencedoraEscassa);
  it('deve descartar pelo índice canônico quando há folga sobre a necessidade', deveDescartarPorIndice);
  it(
    'deve preservar a mais forte e descartar a segunda mais forte com necessidade 1',
    deveDescartarPreservandoAMaisForte,
  );
  it('deve descartar a carta mais fraca quando candidatas não excedem a necessidade', deveDescartarEscassa);
  it('deve ordenar por força real considerando manilha e desempate por naipe', deveOrdenarPorForcaReal);
});

function deveEscolherVencedoraPorIndice(): void {
  const vencedoras = avaliar([criarCarta('5', '♦'), criarCarta('8', '♦'), criarCarta('K', '♦')]);

  expect(escolherVencedoraPorNecessidade(vencedoras, '6', 2).carta).toEqual(criarCarta('8', '♦'));
}

function deveEscolherVencedoraEscassa(): void {
  const vencedoras = avaliar([criarCarta('5', '♦'), criarCarta('8', '♦'), criarCarta('K', '♦')]);

  expect(escolherVencedoraPorNecessidade(vencedoras, '6', 4).carta).toEqual(criarCarta('5', '♦'));
}

function deveDescartarPorIndice(): void {
  const candidatas = avaliar([criarCarta('4', '♦'), criarCarta('6', '♦'), criarCarta('9', '♦'), criarCarta('Q', '♦')]);

  expect(descartePorNecessidade(candidatas, '5', 2).carta).toEqual(criarCarta('6', '♦'));
}

function deveDescartarPreservandoAMaisForte(): void {
  const candidatas = avaliar([criarCarta('4', '♦'), criarCarta('6', '♦'), criarCarta('9', '♦'), criarCarta('Q', '♦')]);

  // Precisa fazer 1 e não vence agora: reserva a Q para a vaza futura e joga a 9.
  expect(descartePorNecessidade(candidatas, '5', 1).carta).toEqual(criarCarta('9', '♦'));
}

function deveDescartarEscassa(): void {
  const candidatas = avaliar([criarCarta('4', '♦'), criarCarta('6', '♦')]);

  expect(descartePorNecessidade(candidatas, '5', 2).carta).toEqual(criarCarta('4', '♦'));
}

function deveOrdenarPorForcaReal(): void {
  const cartas = avaliar([criarCarta('5', '♦'), criarCarta('5', '♣'), criarCarta('3', '♦')]);

  expect(ordenarPorForcaReal(cartas, '5').map((avaliada) => avaliada.carta)).toEqual([
    criarCarta('3', '♦'),
    criarCarta('5', '♦'),
    criarCarta('5', '♣'),
  ]);
}

function avaliar(cartas: Carta[]): CartaAvaliada[] {
  return cartas.map((carta, indice) => ({ carta, score: indice, categoria: 'baixa' }));
}
