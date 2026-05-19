import { describe, expect, it } from 'vitest';
import { RegistroCartasReveladas } from '@/core/RegistroCartasReveladas';
import { criarCarta } from './rodada-fixtures';

describe('RegistroCartasReveladas', () => {
  it('deve registrar carta revelada legalmente', () => {
    const registro = new RegistroCartasReveladas();
    const carta = criarCarta('A', '♣');
    registro.registrar(carta);
    expect(registro.cartasReveladas()).toEqual([carta]);
  });

  it('deve indicar que carta não registrada não foi revelada', () => {
    const registro = new RegistroCartasReveladas();
    registro.registrar(criarCarta('A', '♣'));
    expect(registro.foiRevelada(criarCarta('K', '♥'))).toBe(false);
  });

  it('deve retornar apenas cartas reveladas que batem a consulta', () => {
    const registro = new RegistroCartasReveladas();
    registro.registrar(criarCarta('A', '♣'));
    registro.registrar(criarCarta('4', '♥'));
    registro.registrar(criarCarta('K', '♦'));
    expect(registro.cartasSuperioresReveladas(criarCarta('K', '♣'), '4')).toEqual([
      criarCarta('A', '♣'),
      criarCarta('4', '♥'),
    ]);
  });

  it('deve limpar cartas reveladas ao reiniciar', () => {
    const registro = new RegistroCartasReveladas();
    registro.registrar(criarCarta('A', '♣'));
    registro.reiniciar();
    expect(registro.cartasReveladas()).toEqual([]);
  });
});
