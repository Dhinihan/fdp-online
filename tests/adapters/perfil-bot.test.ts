import { describe, expect, it } from 'vitest';
import {
  aplicarPerfisBots,
  nomePorTemperatura,
  nomesBotsPorTemperatura,
  perfisBotsPorTemperatura,
  sortearPerfisBots,
} from '@/adapters/bots/perfil-bot';
import { RngComSeed } from '@/core/RngComSeed';
import type { Jogador } from '@/types/entidades';

const TOTAL_FAIXAS = nomesBotsPorTemperatura.length;
const SEEDS = Array.from({ length: 1000 }, (_, indice) => indice);

function jogadores(): Jogador[] {
  return [
    { id: 'humano', nome: 'Humano', pontos: 5 },
    { id: 'bot1', nome: 'Bot 1', pontos: 5 },
    { id: 'bot2', nome: 'Bot 2', pontos: 5 },
    { id: 'bot3', nome: 'Bot 3', pontos: 5 },
  ];
}

function faixaDe(temperatura: number): number {
  return Math.min(Math.floor(temperatura * TOTAL_FAIXAS), TOTAL_FAIXAS - 1);
}

describe('Nomes dos bots', () => {
  it('deve ter exatamente 20 nomes sem duplicatas', () => {
    expect(nomesBotsPorTemperatura).toHaveLength(20);
    expect(new Set(nomesBotsPorTemperatura).size).toBe(20);
  });

  it('deve ter perfilId canônico único por perfil (sem colisão de identidade)', () => {
    const ids = perfisBotsPorTemperatura.map((perfil) => perfil.id);
    expect(ids).toHaveLength(20);
    expect(new Set(ids).size).toBe(20);
  });

  it('deve manter o nome estavel por faixa de temperatura', () => {
    expect(nomePorTemperatura(0)).toBe('Brás');
    expect(nomePorTemperatura(0.049)).toBe('Brás');
    expect(nomePorTemperatura(0.05)).toBe('Severino');
    expect(nomePorTemperatura(0.999)).toBe('Iracema');
  });
});

describe('Perfil dos bots', () => {
  it('nunca deve sortear dois bots com o mesmo nome (zero colisoes em 1000 seeds)', () => {
    for (const seed of SEEDS) {
      const perfis = sortearPerfisBots(jogadores(), new RngComSeed(seed));
      const nomes = perfis.map((perfil) => perfil.nome);
      expect(new Set(nomes).size, `colisao de nome na seed ${seed.toString()}`).toBe(nomes.length);
    }
  });

  it('deve sortear bots em faixas de temperatura distintas', () => {
    for (const seed of SEEDS) {
      const perfis = sortearPerfisBots(jogadores(), new RngComSeed(seed));
      const faixas = perfis.map((perfil) => faixaDe(perfil.temperatura));
      expect(new Set(faixas).size, `faixas repetidas na seed ${seed.toString()}`).toBe(faixas.length);
    }
  });

  it('deve manter nome e temperatura coerentes (nome = nomePorTemperatura(temperatura))', () => {
    for (const seed of SEEDS) {
      const perfis = sortearPerfisBots(jogadores(), new RngComSeed(seed));
      for (const perfil of perfis) {
        expect(perfil.nome).toBe(nomePorTemperatura(perfil.temperatura));
      }
    }
  });

  it('deve sortear temperaturas no intervalo de 0 ate antes de 1', () => {
    for (const seed of SEEDS) {
      const perfis = sortearPerfisBots(jogadores(), new RngComSeed(seed));
      expect(perfis.every((perfil) => perfil.temperatura >= 0 && perfil.temperatura < 1)).toBe(true);
    }
  });
});

describe('Perfil dos bots — identidade canônica', () => {
  it('deve atribuir o perfilId canônico da faixa, desacoplado do nome exibido', () => {
    for (const seed of SEEDS) {
      const perfis = sortearPerfisBots(jogadores(), new RngComSeed(seed));
      for (const perfil of perfis) {
        expect(perfil.perfilId).toBe(perfisBotsPorTemperatura[faixaDe(perfil.temperatura)].id);
      }
    }
  });
});

describe('Perfil dos bots — determinismo e distribuicao', () => {
  it('deve ser deterministico: mesma seed produz o mesmo resultado', () => {
    for (const seed of [0, 7, 158, 999]) {
      const primeiro = sortearPerfisBots(jogadores(), new RngComSeed(seed));
      const segundo = sortearPerfisBots(jogadores(), new RngComSeed(seed));
      expect(segundo).toEqual(primeiro);
    }
  });

  it('nao deve proibir tres bots na metade alta da escala (sem forcar espalhamento)', () => {
    const todasAltas = SEEDS.some((seed) => {
      const perfis = sortearPerfisBots(jogadores(), new RngComSeed(seed));
      return perfis.length >= 3 && perfis.every((perfil) => faixaDe(perfil.temperatura) >= TOTAL_FAIXAS / 2);
    });
    expect(todasAltas).toBe(true);
  });

  it('deve aplicar perfilId, nome e temperatura apenas nos bots', () => {
    const perfis = [
      { id: 'bot1', perfilId: 'severino', nome: 'Severino', temperatura: 0.05 },
      { id: 'bot2', perfilId: 'iara', nome: 'Iara', temperatura: 0.1 },
      { id: 'bot3', perfilId: 'bento', nome: 'Bento', temperatura: 0.15 },
    ];

    expect(aplicarPerfisBots(jogadores(), perfis)).toEqual([
      { id: 'humano', nome: 'Humano', pontos: 5 },
      { id: 'bot1', perfilId: 'severino', nome: 'Severino', pontos: 5, temperatura: 0.05 },
      { id: 'bot2', perfilId: 'iara', nome: 'Iara', pontos: 5, temperatura: 0.1 },
      { id: 'bot3', perfilId: 'bento', nome: 'Bento', pontos: 5, temperatura: 0.15 },
    ]);
  });
});
