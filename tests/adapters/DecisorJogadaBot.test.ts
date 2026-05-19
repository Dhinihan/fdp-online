import { describe, expect, it } from 'vitest';
import { DecisorJogadaBot } from '@/adapters/bots/DecisorJogadaBot';
import { DecisorJogadaLinhaFria } from '@/adapters/bots/DecisorJogadaLinhaFria';
import type { Carta } from '@/core/Carta';
import type { Jogador } from '@/types/entidades';
import type { EstadoEmJogo, MesaItem } from '@/types/estado-rodada';
import { criarCarta, criarJogador } from '../core/rodada-fixtures';

describe('DecisorJogadaBot', () => {
  it('deve escolher linha quente com segurança quando o RNG cai abaixo da temperatura', escolheLinhaQuente);
  it('deve escolher linha fria com segurança quando a temperatura é zero', escolheLinhaFria);
  it('deve atravessar com carta barata quando precisa e tem folga baixa', atravessaComCartaBarata);
  it('deve empatar alta quando já cumpriu para se livrar de carta indesejada', empataAltaCumprido);
  it('deve convergir para linha fria quando não existe pressão agora', convergeSemPressao);
  it('deve repetir a escolha com RNG determinístico', repeteEscolhaDeterministica);
  it('deve abrir com baixa quando urgência é baixa', abrirUrgenciaBaixa);
  it('deve abrir forte quando bot é frio e urgência é alta', abrirFrioUrgenciaAlta);
  it('deve abrir média e segurar garantida quando bot é quente e urgência é alta', abrirQuenteUrgenciaAlta);
  it('deve escolher a de menor score dentro da mesma categoria na abertura', abrirMenorScoreNaCategoria);
  it('deve jogar garantida quando só tem ela na abertura', abrirGarantidaInevitavel);
  it('deve lidar com folga negativa na abertura sem quebrar ou dar NaN/Infinity', abrirFolgaNegativa);
});

async function escolheLinhaQuente(): Promise<void> {
  const estado = criarEstado(cenarioBifurcacao());
  const bot = criarBot(1, 0);

  await expect(bot.decidirJogada(maoBifurcacao(), estado)).resolves.toEqual(criarCarta('Q', '♠'));
}

async function escolheLinhaFria(): Promise<void> {
  const estado = criarEstado(cenarioBifurcacao());
  const bot = criarBot(0, 0);

  await expect(bot.decidirJogada(maoBifurcacao(), estado)).resolves.toEqual(criarCarta('3', '♦'));
}

async function atravessaComCartaBarata(): Promise<void> {
  const estado = criarEstado({ mesa: mesaComK(), declaracoes: { j1: 1, bot: 1 }, vazas: { j1: 0, bot: 0 } });
  const bot = criarBot(1, 0);

  await expect(bot.decidirJogada([criarCarta('A', '♦'), criarCarta('3', '♦')], estado)).resolves.toEqual(
    criarCarta('A', '♦'),
  );
}

async function empataAltaCumprido(): Promise<void> {
  const estado = criarEstado({ mesa: mesaComK(), declaracoes: { bot: 1 }, vazas: { bot: 1 } });
  const bot = criarBot(1, 0);

  await expect(bot.decidirJogada([criarCarta('K', '♦'), criarCarta('4', '♦')], estado)).resolves.toEqual(
    criarCarta('K', '♦'),
  );
}

async function convergeSemPressao(): Promise<void> {
  const estado = criarEstado({ mesa: mesaComBaixa(), declaracoes: { j2: 1, bot: 1 }, vazas: { j2: 0, bot: 0 } });
  const mao = [criarCarta('A', '♦'), criarCarta('3', '♦')];
  const bot = criarBot(1, 0);
  const fria = new DecisorJogadaLinhaFria();

  await expect(bot.decidirJogada(mao, estado)).resolves.toEqual(await fria.decidirJogada(mao, estado));
}

async function repeteEscolhaDeterministica(): Promise<void> {
  const estado = criarEstado(cenarioBifurcacao());
  const primeiro = await criarBot(0.5, 0.4).decidirJogada(maoBifurcacao(), estado);
  const segundo = await criarBot(0.5, 0.4).decidirJogada(maoBifurcacao(), estado);

  expect(primeiro).toEqual(segundo);
}

function criarBot(temperatura: number, valorRng: number): DecisorJogadaBot {
  return new DecisorJogadaBot({ temperatura, rng: { random: () => valorRng }, liderBaixa: 20, liderAlta: 10 });
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

function cenarioBifurcacao(): Partial<EstadoEmJogo> {
  return {
    mesa: mesaComK(),
    declaracoes: { j1: 0, j2: 1, bot: 1 },
    vazas: { j1: 0, j2: 0, bot: 0 },
    cartasReveladas: cartasQueGarantemTresDeOuros(),
  };
}

function maoBifurcacao(): Carta[] {
  return [criarCarta('Q', '♠'), criarCarta('3', '♦')];
}

function criarJogadores(): Jogador[] {
  return [criarJogador('j1', 'J1'), criarJogador('j2', 'J2'), criarJogador('j3', 'J3'), criarJogador('bot', 'Bot')];
}

function mesaComBaixa(): MesaItem[] {
  return [
    { jogadorId: 'j1', carta: criarCarta('8', '♣') },
    { jogadorId: 'j2', carta: criarCarta('4', '♥') },
    { jogadorId: 'j3', carta: criarCarta('6', '♠') },
  ];
}

function mesaComK(): MesaItem[] {
  return [
    { jogadorId: 'j1', carta: criarCarta('K', '♣') },
    { jogadorId: 'j2', carta: criarCarta('7', '♥') },
    { jogadorId: 'j3', carta: criarCarta('8', '♠') },
  ];
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

  const decisao = await bot.decidirJogada(mao, estado);
  expect(decisao).toBeDefined();
}
