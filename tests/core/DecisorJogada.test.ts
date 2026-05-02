import { describe, it, expect } from 'vitest';
import type { Carta } from '@/core/Carta';
import type { DecisorJogada } from '@/core/portas/DecisorJogada';

describe('DecisorJogada — teste de compilação', () => {
  it('pode ser implementado por um bot', () => {
    const bot: DecisorJogada = {
      decidirJogada: (mao: Carta[]): Promise<Carta> => Promise.resolve(mao[0]),
    };
    expect(typeof bot.decidirJogada === 'function').toBe(true);
  });

  it('pode ser implementado por um humano', () => {
    const humano: DecisorJogada = {
      decidirJogada: (): Promise<Carta> => Promise.resolve({ valor: '3', naipe: '♣' }),
    };
    expect(typeof humano.decidirJogada === 'function').toBe(true);
  });
});
