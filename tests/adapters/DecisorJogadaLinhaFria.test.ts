import { describe, expect, it } from 'vitest';
import { DecisorJogadaLinhaFria } from '@/adapters/bots/DecisorJogadaLinhaFria';
import type { Carta } from '@/core/Carta';
import type { Jogador } from '@/types/entidades';
import type { EstadoEmJogo, MesaItem } from '@/types/estado-rodada';
import { criarCarta, criarJogador } from '../core/rodada-fixtures';

describe('DecisorJogadaLinhaFria', () => {
  it('deve fazer a vaza quando é o último, precisa fazer e tem carta que ganha', deveFazerVazaNoFim);
  it('deve jogar o menor prejuízo quando é o último, precisa fazer e não tem carta que ganha', deveJogarMenorPrejuizo);
  it('deve fugir com a carta alta que ainda perde quando já cumpriu', deveFugirComCartaAlta);
  it('deve fazer sem desperdiçar carta garantida quando ainda não é o último', devePreservarGarantida);
  it('deve deixar outro jogador fazer quando a mesa está favorável', deveDeixarOutroFazer);
});

async function deveFazerVazaNoFim(): Promise<void> {
  const estado = criarEstado({ mesa: mesaComK(), declaracoes: { bot: 1 }, vazas: { bot: 0 } });
  const bot = new DecisorJogadaLinhaFria();

  await expect(bot.decidirJogada([criarCarta('4', '♦'), criarCarta('3', '♦')], estado)).resolves.toEqual(
    criarCarta('3', '♦'),
  );
}

async function deveJogarMenorPrejuizo(): Promise<void> {
  const estado = criarEstado({ mesa: mesaComK(), declaracoes: { bot: 1 }, vazas: { bot: 0 } });
  const bot = new DecisorJogadaLinhaFria();

  await expect(bot.decidirJogada([criarCarta('4', '♦'), criarCarta('Q', '♠')], estado)).resolves.toEqual(
    criarCarta('Q', '♠'),
  );
}

async function deveFugirComCartaAlta(): Promise<void> {
  const estado = criarEstado({ mesa: mesaComK(), declaracoes: { bot: 1 }, vazas: { bot: 1 } });
  const bot = new DecisorJogadaLinhaFria();

  await expect(bot.decidirJogada([criarCarta('4', '♦'), criarCarta('Q', '♠')], estado)).resolves.toEqual(
    criarCarta('Q', '♠'),
  );
}

async function devePreservarGarantida(): Promise<void> {
  const estado = criarEstado(cenarioGarantida());
  const bot = new DecisorJogadaLinhaFria();

  await expect(bot.decidirJogada([criarCarta('6', '♦'), criarCarta('3', '♦')], estado)).resolves.toEqual(
    criarCarta('6', '♦'),
  );
}

async function deveDeixarOutroFazer(): Promise<void> {
  const estado = criarEstado({ mesa: mesaComK(), declaracoes: { j1: 1, bot: 0 }, vazas: { j1: 0, bot: 0 } });
  const bot = new DecisorJogadaLinhaFria();

  await expect(bot.decidirJogada([criarCarta('4', '♦'), criarCarta('Q', '♠')], estado)).resolves.toEqual(
    criarCarta('4', '♦'),
  );
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

function mesaComK(): MesaItem[] {
  return [
    { jogadorId: 'j1', carta: criarCarta('K', '♣') },
    { jogadorId: 'j2', carta: criarCarta('7', '♥') },
    { jogadorId: 'j3', carta: criarCarta('8', '♠') },
  ];
}

function cenarioGarantida(): Partial<EstadoEmJogo> {
  return {
    mesa: [{ jogadorId: 'j1', carta: criarCarta('5', '♣') }],
    jogadorAtual: 1,
    declaracoes: { bot: 1 },
    vazas: { bot: 0 },
    manilha: '4',
    cartasReveladas: cartasQueGarantemTresDeOuros(),
  };
}

function cartasQueGarantemTresDeOuros(): Carta[] {
  return [
    criarCarta('3', '♣'),
    criarCarta('3', '♥'),
    criarCarta('3', '♠'),
    criarCarta('4', '♣'),
    criarCarta('4', '♥'),
    criarCarta('4', '♠'),
    criarCarta('4', '♦'),
  ];
}
