import { describe, it, expect } from 'vitest';
import { BotDeterministico } from '@/adapters/bots/BotDeterministico';
import type { Carta } from '@/core/Carta';

function criarCarta(valor: Carta['valor'], naipe: Carta['naipe']): Carta {
  return { valor, naipe };
}

describe('BotDeterministico', () => {
  it('deve jogar a carta de menor valor da mão', async () => {
    const bot = new BotDeterministico();
    const mao: Carta[] = [criarCarta('J', '♣'), criarCarta('4', '♥'), criarCarta('5', '♠')];
    const carta = await bot.decidirJogada(mao, {});
    expect(carta).toEqual(criarCarta('4', '♥'));
  });

  it('deve lançar erro quando a mão está vazia', async () => {
    const bot = new BotDeterministico();
    await expect(bot.decidirJogada([], {})).rejects.toThrow('Mão vazia');
  });

  it('deve jogar a única carta disponível', async () => {
    const bot = new BotDeterministico();
    const mao: Carta[] = [criarCarta('A', '♦')];
    const carta = await bot.decidirJogada(mao, {});
    expect(carta).toEqual(criarCarta('A', '♦'));
  });

  it('deve usar naipe como desempate quando valores são iguais (menor naipe primeiro)', async () => {
    const bot = new BotDeterministico();
    const mao: Carta[] = [criarCarta('7', '♣'), criarCarta('7', '♦'), criarCarta('7', '♥')];
    const carta = await bot.decidirJogada(mao, {});
    expect(carta).toEqual(criarCarta('7', '♦'));
  });
});
