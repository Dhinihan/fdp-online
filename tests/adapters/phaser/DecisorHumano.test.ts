import { describe, it, expect } from 'vitest';
import { DecisorHumano } from '@/adapters/phaser/DecisorHumano';
import type { Carta } from '@/core/Carta';

describe('DecisorHumano', () => {
  it('resolve Promise com carta confirmada após confirmar()', async () => {
    const decisor = new DecisorHumano();
    const carta: Carta = { valor: 'A', naipe: '♠' };
    const promessa = decisor.decidirJogada([], {});
    decisor.selecionar(carta);
    decisor.confirmar();
    await expect(promessa).resolves.toEqual(carta);
  });

  it('lança erro se confirmar() sem selecionar()', () => {
    const decisor = new DecisorHumano();
    void decisor.decidirJogada([], {});
    expect(() => {
      decisor.confirmar();
    }).toThrow('Nenhuma carta selecionada');
  });
});
