import { describe, it, expect } from 'vitest';
import type { Carta } from '@/core/Carta';
import { compararValor, compararNaipe, obterProximoValor, ehManilha } from '@/core/Carta';

const valores: Carta['valor'][] = ['3', '2', 'A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4'];
const naipes: Carta['naipe'][] = ['♣', '♥', '♠', '♦'];

function criarCarta(valor: Carta['valor'], naipe: Carta['naipe']): Carta {
  return { valor, naipe };
}

describe('compararValor', () => {
  it.each(valores.flatMap((superior, i) => valores.slice(i + 1).map((inferior) => [superior, inferior] as const)))(
    'deve retornar true quando %s > %s',
    (superior, inferior) => {
      expect(compararValor(criarCarta(superior, '♣'), criarCarta(inferior, '♣'))).toBe(true);
    },
  );

  it.each(valores.flatMap((superior, i) => valores.slice(i + 1).map((inferior) => [inferior, superior] as const)))(
    'deve retornar false quando %s < %s',
    (inferior, superior) => {
      expect(compararValor(criarCarta(inferior, '♣'), criarCarta(superior, '♣'))).toBe(false);
    },
  );

  it.each(valores)('deve retornar false quando valores são iguais (%s)', (valor) => {
    expect(compararValor(criarCarta(valor, '♣'), criarCarta(valor, '♥'))).toBe(false);
  });
});

describe('compararNaipe', () => {
  it.each(naipes.flatMap((superior, i) => naipes.slice(i + 1).map((inferior) => [superior, inferior] as const)))(
    'deve retornar true quando %s > %s',
    (superior, inferior) => {
      expect(compararNaipe(criarCarta('3', superior), criarCarta('3', inferior))).toBe(true);
    },
  );

  it.each(naipes.flatMap((superior, i) => naipes.slice(i + 1).map((inferior) => [inferior, superior] as const)))(
    'deve retornar false quando %s < %s',
    (inferior, superior) => {
      expect(compararNaipe(criarCarta('3', inferior), criarCarta('3', superior))).toBe(false);
    },
  );

  it.each(naipes)('deve retornar false quando naipes são iguais (%s)', (naipe) => {
    expect(compararNaipe(criarCarta('3', naipe), criarCarta('2', naipe))).toBe(false);
  });
});

describe('obterProximoValor', () => {
  const casos: [Carta['valor'], Carta['valor']][] = [
    ['2', '3'],
    ['A', '2'],
    ['K', 'A'],
    ['Q', 'K'],
    ['J', 'Q'],
    ['10', 'J'],
    ['9', '10'],
    ['8', '9'],
    ['7', '8'],
    ['6', '7'],
    ['5', '6'],
    ['4', '5'],
    ['3', '4'],
  ];

  it.each(casos)('deve retornar %s após %s', (esperado, entrada) => {
    expect(obterProximoValor(entrada)).toBe(esperado);
  });
});

describe('ehManilha', () => {
  it.each(valores)('deve retornar true quando carta é manilha (%s)', (valor) => {
    expect(ehManilha(criarCarta(valor, '♣'), valor)).toBe(true);
  });

  it.each(valores.flatMap((a, i) => valores.filter((_, j) => i !== j).map((b) => [a, b] as const)))(
    'deve retornar false quando carta %s não é manilha %s',
    (valorCarta, valorManilha) => {
      expect(ehManilha(criarCarta(valorCarta, '♣'), valorManilha)).toBe(false);
    },
  );
});
