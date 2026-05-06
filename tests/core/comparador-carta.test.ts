import { describe, it, expect } from 'vitest';
import { cartaVence, calcularIndiceVencedor } from '@/core/comparador-carta';
import { criarCarta } from './rodada-fixtures';

describe('comparador-carta', () => {
  it('deve fazer manilha vencer carta não-manilha', () => {
    expect(cartaVence(criarCarta('4', '♣'), criarCarta('3', '♦'), '4')).toBe(true);
    expect(cartaVence(criarCarta('3', '♦'), criarCarta('4', '♣'), '4')).toBe(false);
  });

  it('deve desempatar manilhas pelo naipe', () => {
    expect(cartaVence(criarCarta('4', '♣'), criarCarta('4', '♦'), '4')).toBe(true);
    expect(cartaVence(criarCarta('4', '♦'), criarCarta('4', '♣'), '4')).toBe(false);
  });

  it('deve comparar valor quando nenhuma é manilha', () => {
    expect(cartaVence(criarCarta('3', '♣'), criarCarta('2', '♦'), '4')).toBe(true);
    expect(cartaVence(criarCarta('2', '♦'), criarCarta('3', '♣'), '4')).toBe(false);
  });

  it('deve empatar quando cartas não-manilha têm o mesmo valor', () => {
    expect(cartaVence(criarCarta('3', '♣'), criarCarta('3', '♦'), '4')).toBe(false);
    expect(cartaVence(criarCarta('3', '♦'), criarCarta('3', '♣'), '4')).toBe(false);
  });

  it('deve calcular índice do vencedor na mesa', () => {
    const mesa = [{ carta: criarCarta('2', '♥') }, { carta: criarCarta('3', '♠') }, { carta: criarCarta('A', '♦') }];
    expect(calcularIndiceVencedor(mesa, '4')).toBe(1);
  });
});
