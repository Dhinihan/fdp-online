import { describe, expect, it, vi } from 'vitest';
import { DecisorJogadaLinhaFria } from '@/adapters/bots/DecisorJogadaLinhaFria';
import { DecisorJogadaLinhaQuente } from '@/adapters/bots/DecisorJogadaLinhaQuente';
import type { Carta } from '@/core/Carta';
import type { Jogador } from '@/types/entidades';
import type { EstadoEmJogo, MesaItem } from '@/types/estado-rodada';
import { criarCarta, criarJogador } from '../core/rodada-fixtures';

describe('DecisorJogadaLinhaQuente', () => {
  it('deve escolher linha quente com segurança quando o RNG cai abaixo da temperatura', escolheLinhaQuente);
  it('deve escolher linha fria com segurança quando a temperatura é zero', escolheLinhaFria);
  it('deve atravessar com carta barata quando precisa e tem folga baixa', atravessaComCartaBarata);
  it('deve empatar alta quando já cumpriu para se livrar de carta indesejada', empataAltaCumprido);
  it('deve convergir para linha fria quando não existe pressão agora', convergeSemPressao);
  it('não deve sortear temperatura quando não há bifurcação', naoSorteiaSemBifurcacao);
  it('deve repetir a escolha com RNG determinístico', repeteEscolhaDeterministica);
});

async function escolheLinhaQuente(): Promise<void> {
  const estado = criarEstado(cenarioBifurcacao());
  const bot = criarBot(1, 0);

  await expect(bot.decidirJogada(maoBifurcacao(), estado)).resolves.toEqual(criarCarta('4', '♦'));
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

async function naoSorteiaSemBifurcacao(): Promise<void> {
  const estado = criarEstado({ mesa: mesaComBaixa(), declaracoes: { j2: 1, bot: 1 }, vazas: { j2: 0, bot: 0 } });
  const random = vi.fn(() => 0);
  const bot = new DecisorJogadaLinhaQuente({ temperatura: 1, rng: { random }, liderBaixa: 8, liderAlta: 11 });

  await bot.decidirJogada([criarCarta('A', '♦'), criarCarta('3', '♦')], estado);

  expect(random).not.toHaveBeenCalled();
}

async function repeteEscolhaDeterministica(): Promise<void> {
  const estado = criarEstado(cenarioBifurcacao());
  const primeiro = await criarBot(0.5, 0.4).decidirJogada(maoBifurcacao(), estado);
  const segundo = await criarBot(0.5, 0.4).decidirJogada(maoBifurcacao(), estado);

  expect(primeiro).toEqual(segundo);
}

function criarBot(temperatura: number, valorRng: number): DecisorJogadaLinhaQuente {
  return new DecisorJogadaLinhaQuente({ temperatura, rng: { random: () => valorRng }, liderBaixa: 8, liderAlta: 11 });
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
    mesa: mesaComQuatro(),
    declaracoes: { j1: 0, j2: 1, bot: 1 },
    vazas: { j1: 0, j2: 0, bot: 0 },
    cartasReveladas: cartasQueGarantemTresDeOuros(),
  };
}

function maoBifurcacao(): Carta[] {
  return [criarCarta('3', '♦'), criarCarta('4', '♦')];
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

function mesaComQuatro(): MesaItem[] {
  return [
    { jogadorId: 'j1', carta: criarCarta('4', '♣') },
    { jogadorId: 'j2', carta: criarCarta('4', '♥') },
    { jogadorId: 'j3', carta: criarCarta('4', '♠') },
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
