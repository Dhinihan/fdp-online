import { describe, expect, it } from 'vitest';
import { DecisorJogadaBot } from '@/adapters/bots/DecisorJogadaBot';
import type { Carta } from '@/core/Carta';
import type { Jogador } from '@/types/entidades';
import type { EstadoEmJogo } from '@/types/estado-rodada';
import { criarCarta, criarJogador } from '../core/rodada-fixtures';

describe('DecisorJogadaBot', () => {
  it('deve delegar a jogada de reação para o decisor quente', deveDelegarReacao);
  it('deve abrir com baixa quando urgência é baixa', abrirUrgenciaBaixa);
  it('deve abrir forte quando bot é frio e urgência é alta', abrirFrioUrgenciaAlta);
  it('deve abrir média e segurar garantida quando bot é quente e urgência é alta', abrirQuenteUrgenciaAlta);
  it('deve escolher a de menor score dentro da mesma categoria na abertura', abrirMenorScoreNaCategoria);
  it('deve jogar garantida quando só tem ela na abertura', abrirGarantidaInevitavel);
  it('deve lidar com folga negativa na abertura sem quebrar ou dar NaN/Infinity', abrirFolgaNegativa);
});

async function deveDelegarReacao(): Promise<void> {
  const estado = criarEstado({
    mesa: [
      { jogadorId: 'j1', carta: criarCarta('4', '♣') },
      { jogadorId: 'j2', carta: criarCarta('4', '♥') },
      { jogadorId: 'j3', carta: criarCarta('4', '♠') },
    ],
    declaracoes: { j1: 0, j2: 1, bot: 1 },
    vazas: { j1: 0, j2: 0, bot: 0 },
    cartasReveladas: cartasQueGarantemTresDeOuros(),
  });
  const bot = criarBot(1, 0);
  const mao = [criarCarta('3', '♦'), criarCarta('4', '♦')];

  await expect(bot.decidirJogada(mao, estado)).resolves.toEqual(criarCarta('4', '♦'));
}

async function abrirUrgenciaBaixa(): Promise<void> {
  const estado = criarEstado({
    mesa: [],
    declaracoes: { bot: 0 },
    vazas: { bot: 0 },
    cartasReveladas: cartasQueGarantemTresDeOuros(),
  });
  const bot = criarBot(0, 0);
  const mao = [criarCarta('3', '♦'), criarCarta('2', '♠'), criarCarta('8', '♦'), criarCarta('4', '♦')];

  await expect(bot.decidirJogada(mao, estado)).resolves.toEqual(criarCarta('4', '♦'));
}

async function abrirFrioUrgenciaAlta(): Promise<void> {
  const estado = criarEstado({
    mesa: [],
    declaracoes: { bot: 1 },
    vazas: { bot: 0 },
    cartasReveladas: [],
  });
  const bot = new DecisorJogadaBot({ temperatura: 0, rng: { random: () => 0 }, urgenciaAbrirForte: 0.5 });
  const mao = [criarCarta('2', '♠'), criarCarta('8', '♦')];

  await expect(bot.decidirJogada(mao, estado)).resolves.toEqual(criarCarta('2', '♠'));
}

async function abrirQuenteUrgenciaAlta(): Promise<void> {
  const estado = criarEstado({
    mesa: [],
    declaracoes: { bot: 1 },
    vazas: { bot: 0 },
    cartasReveladas: cartasQueGarantemTresDeOuros(),
  });
  const bot = new DecisorJogadaBot({ temperatura: 0.5, rng: { random: () => 0 }, urgenciaAbrirForte: 0.5 });
  const mao = [criarCarta('3', '♦'), criarCarta('8', '♦')];

  await expect(bot.decidirJogada(mao, estado)).resolves.toEqual(criarCarta('8', '♦'));
}

async function abrirMenorScoreNaCategoria(): Promise<void> {
  const estado = criarEstado({
    mesa: [],
    declaracoes: { bot: 0 },
    vazas: { bot: 0 },
    cartasReveladas: [],
  });
  const bot = criarBot(0, 0);
  const mao = [criarCarta('10', '♦'), criarCarta('8', '♦')];

  await expect(bot.decidirJogada(mao, estado)).resolves.toEqual(criarCarta('8', '♦'));
}

async function abrirGarantidaInevitavel(): Promise<void> {
  const estado = criarEstado({
    mesa: [],
    declaracoes: { bot: 0 },
    vazas: { bot: 0 },
    cartasReveladas: cartasQueGarantemTresDeOuros(),
  });
  const bot = criarBot(0, 0);
  const mao = [criarCarta('3', '♦')];

  await expect(bot.decidirJogada(mao, estado)).resolves.toEqual(criarCarta('3', '♦'));
}

async function abrirFolgaNegativa(): Promise<void> {
  const estado = criarEstado({
    mesa: [],
    declaracoes: { bot: 5 },
    vazas: { bot: 0 },
    cartasReveladas: [],
  });
  const bot = new DecisorJogadaBot({ temperatura: 0.5, rng: { random: () => 0 }, urgenciaAbrirForte: 0.5 });
  const mao = [criarCarta('2', '♠'), criarCarta('8', '♦'), criarCarta('A', '♣')];

  // A urgência deve ser alta (quebra de cautela) e escolher a carta '2' de Espadas (alta)
  await expect(bot.decidirJogada(mao, estado)).resolves.toEqual(criarCarta('2', '♠'));
}

function criarBot(temperatura: number, valorRng: number): DecisorJogadaBot {
  return new DecisorJogadaBot({ temperatura, rng: { random: () => valorRng }, liderBaixa: 8, liderAlta: 11 });
}

function criarEstado(config: Partial<EstadoEmJogo>): EstadoEmJogo {
  const jogadores = criarJogadores();
  return {
    fase: 'aguardandoJogada',
    jogadorAtual: 3,
    pontos: {},
    maos: jogadores.map((jogador) => ({ jogador, cartas: [], visivel: true })),
    cartasPorRodada: 3,
    manilha: '5',
    cartaVirada: null,
    declaracoes: {},
    mesa: [],
    cartasReveladas: [],
    vazas: {},
    turno: 1,
    ...config,
  };
}

function criarJogadores(): Jogador[] {
  return [criarJogador('j1', 'J1'), criarJogador('j2', 'J2'), criarJogador('j3', 'J3'), criarJogador('bot', 'Bot')];
}

function cartasQueGarantemTresDeOuros(): Carta[] {
  return [
    criarCarta('3', '♣'),
    criarCarta('3', '♥'),
    criarCarta('3', '♠'),
    criarCarta('5', '♣'),
    criarCarta('5', '♥'),
    criarCarta('5', '♠'),
    criarCarta('5', '♦'),
  ];
}
