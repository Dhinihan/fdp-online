import { describe, expect, it } from 'vitest';
import {
  aplicarPerfisBots,
  nomePorTemperatura,
  nomesBotsPorTemperatura,
  sortearPerfisBots,
} from '@/adapters/bots/perfil-bot';
import { RngComSeed } from '@/core/RngComSeed';
import type { Jogador } from '@/types/entidades';

function jogadores(): Jogador[] {
  return [
    { id: 'humano', nome: 'Humano', pontos: 5 },
    { id: 'bot1', nome: 'Bot 1', pontos: 5 },
    { id: 'bot2', nome: 'Bot 2', pontos: 5 },
    { id: 'bot3', nome: 'Bot 3', pontos: 5 },
  ];
}

describe('Nomes dos bots', () => {
  it('deve ter exatamente 20 nomes sem duplicatas', () => {
    expect(nomesBotsPorTemperatura).toHaveLength(20);
    expect(new Set(nomesBotsPorTemperatura).size).toBe(20);
  });

  it('deve manter o nome estavel por faixa de temperatura', () => {
    expect(nomePorTemperatura(0)).toBe('Brás');
    expect(nomePorTemperatura(0.049)).toBe('Brás');
    expect(nomePorTemperatura(0.05)).toBe('Saci');
    expect(nomePorTemperatura(0.999)).toBe('Iracema');
  });
});

describe('Perfil dos bots', () => {
  it('deve sortear temperaturas deterministicas por seed', () => {
    const primeiro = sortearPerfisBots(jogadores(), new RngComSeed(158));
    const segundo = sortearPerfisBots(jogadores(), new RngComSeed(158));

    expect(segundo).toEqual(primeiro);
  });

  it('deve sortear temperaturas no intervalo de 0 ate antes de 1', () => {
    const perfis = sortearPerfisBots(jogadores(), new RngComSeed(158));

    expect(perfis.every((perfil) => perfil.temperatura >= 0 && perfil.temperatura < 1)).toBe(true);
  });

  it('deve aplicar nome e temperatura apenas nos bots', () => {
    const perfis = [
      { id: 'bot1', nome: 'Saci', temperatura: 0.05 },
      { id: 'bot2', nome: 'Iara', temperatura: 0.1 },
      { id: 'bot3', nome: 'Bento', temperatura: 0.15 },
    ];

    expect(aplicarPerfisBots(jogadores(), perfis)).toEqual([
      { id: 'humano', nome: 'Humano', pontos: 5 },
      { id: 'bot1', nome: 'Saci', pontos: 5, temperatura: 0.05 },
      { id: 'bot2', nome: 'Iara', pontos: 5, temperatura: 0.1 },
      { id: 'bot3', nome: 'Bento', pontos: 5, temperatura: 0.15 },
    ]);
  });
});
