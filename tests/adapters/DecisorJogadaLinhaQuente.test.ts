import { describe, expect, it, vi } from 'vitest';
import { DecisorJogadaLinhaFria } from '@/adapters/bots/DecisorJogadaLinhaFria';
import { DecisorJogadaLinhaQuente } from '@/adapters/bots/DecisorJogadaLinhaQuente';
import type { DecisaoJogadaDebug, LoggerDebugBot } from '@/adapters/bots/logger-debug-bot';
import { criarCarta } from '../core/rodada-fixtures';
import {
  cenarioBifurcacao,
  cenarioBifurcacaoAntesDoFim,
  criarEstado,
  maoBifurcacao,
  mesaComBaixa,
  mesaComQuatro,
} from './fixtures-jogada-linha-quente';

describe('DecisorJogadaLinhaQuente', () => {
  it('deve escolher linha quente com segurança quando o RNG cai abaixo da temperatura', escolheLinhaQuente);
  it('deve escolher linha fria com segurança quando a temperatura é zero', escolheLinhaFria);
  it('deve usar posicionamento determinístico quando é o último e precisa fazer', usaPosicionamentoDeterministico);
  it('deve registrar posicionamento determinístico quando logger é injetado', registraPosicionamentoDeterministico);
  it('deve registrar contexto e caminhos auditáveis da decisão', registraContratoExplicavel);
  it('deve empatar quando já cumpriu, líder precisa e carta líder é alta', empataAltaCumprido);
  it('deve preferir perdedora no meio quando líder é média e já cumpriu', perdedoraComLiderMedia);
  it('deve registrar seguir fria quando já cumpriu sem carta que não faz', registraSeguirFriaSemFuga);
  it('deve atravessar com carta barata quando precisa e tem folga baixa', atravessaComCartaBarata);
  it('deve convergir para linha fria quando não existe pressão agora', convergeSemPressao);
  it('não deve sortear temperatura quando não há bifurcação', naoSorteiaSemBifurcacao);
  it('deve repetir a escolha com RNG determinístico', repeteEscolhaDeterministica);
});

async function escolheLinhaQuente(): Promise<void> {
  const estado = criarEstado(cenarioBifurcacaoAntesDoFim());
  const bot = criarBot(1, 0);

  await expect(bot.decidirJogada(maoBifurcacao(), estado)).resolves.toEqual(criarCarta('4', '♦'));
}
async function escolheLinhaFria(): Promise<void> {
  const estado = criarEstado(cenarioBifurcacao());
  const bot = criarBot(0, 0);

  await expect(bot.decidirJogada(maoBifurcacao(), estado)).resolves.toEqual(criarCarta('3', '♦'));
}
async function usaPosicionamentoDeterministico(): Promise<void> {
  const estado = criarEstado({ mesa: mesaComQuatro(), declaracoes: { j1: 1, bot: 2 }, vazas: { j1: 0, bot: 0 } });
  const bot = criarBot(1, 0);

  await expect(
    bot.decidirJogada([criarCarta('6', '♦'), criarCarta('8', '♦'), criarCarta('K', '♦')], estado),
  ).resolves.toEqual(criarCarta('8', '♦'));
}
async function registraPosicionamentoDeterministico(): Promise<void> {
  const estado = criarEstado({ mesa: mesaComQuatro(), declaracoes: { j1: 1, bot: 2 }, vazas: { j1: 0, bot: 0 } });
  const jogadas: DecisaoJogadaDebug[] = [];
  const bot = criarBot(1, 0, {
    registrarDeclaracao: () => undefined,
    registrarJogada: (jogada) => jogadas.push(jogada),
  });

  await bot.decidirJogada([criarCarta('6', '♦'), criarCarta('8', '♦'), criarCarta('K', '♦')], estado);

  expect(jogadas).toHaveLength(1);
  expect(jogadas[0]).toMatchObject({ carta: criarCarta('8', '♦'), escolheuQuente: false });
  expect(jogadas[0]?.sorteio).toBeUndefined();
}
async function registraContratoExplicavel(): Promise<void> {
  const estado = criarEstado(cenarioBifurcacaoAntesDoFim());
  const jogadas: DecisaoJogadaDebug[] = [];
  const bot = criarBot(1, 0, {
    registrarDeclaracao: () => undefined,
    registrarJogada: (jogada) => jogadas.push(jogada),
  });

  await bot.decidirJogada(maoBifurcacao(), estado);

  expect(jogadas).toHaveLength(1);
  expect(jogadas[0]?.contexto).toMatchObject({
    posicaoMesa: 'meio',
    necessidade: 1,
    urgencia: 0.5,
    urgenciaAlta: false,
    jogadoresPorAgir: 1,
    liderId: 'j1',
    liderNecessidade: 0,
    jogadoresInteressadosPorAgir: 0,
  });
  expect(jogadas[0]?.fria).toMatchObject({
    carta: criarCarta('3', '♦'),
    motivo: 'guarda de posição permitiu; jogadores por agir já cumpriram; precisa fazer; regra G[N-X]',
    caminho: ['jogada', 'joga no meio', 'linha fria', 'guarda de posição permitiu'],
  });
  expect(jogadas[0]?.quente?.caminho).toEqual(['jogada', 'joga no meio', 'linha quente']);
  expect(jogadas[0]).toMatchObject(decisaoSorteadaLinhaQuente());
}

async function atravessaComCartaBarata(): Promise<void> {
  const estado = criarEstado({
    mesa: [{ jogadorId: 'j1', carta: criarCarta('K', '♣') }],
    declaracoes: { j1: 1, bot: 1 },
    vazas: { j1: 0, bot: 0 },
  });
  const bot = criarBot(1, 0);

  await expect(bot.decidirJogada([criarCarta('A', '♦'), criarCarta('3', '♦')], estado)).resolves.toEqual(
    criarCarta('A', '♦'),
  );
}

async function empataAltaCumprido(): Promise<void> {
  const estado = criarEstado({
    mesa: [
      { jogadorId: 'j1', carta: criarCarta('2', '♣') },
      { jogadorId: 'j2', carta: criarCarta('7', '♥') },
    ],
    declaracoes: { j1: 1, bot: 1 },
    vazas: { j1: 0, bot: 1 },
  });
  const bot = criarBot(1, 0);

  await expect(bot.decidirJogada([criarCarta('2', '♦'), criarCarta('4', '♦')], estado)).resolves.toEqual(
    criarCarta('2', '♦'),
  );
}

async function perdedoraComLiderMedia(): Promise<void> {
  const estado = criarEstado({
    mesa: [
      { jogadorId: 'j1', carta: criarCarta('9', '♣') },
      { jogadorId: 'j2', carta: criarCarta('6', '♥') },
    ],
    declaracoes: { j1: 1, bot: 1 },
    vazas: { j1: 0, bot: 1 },
  });
  const mao = [criarCarta('9', '♦'), criarCarta('7', '♦')];
  const bot = criarBot(1, 0);
  const fria = new DecisorJogadaLinhaFria();

  await expect(bot.decidirJogada(mao, estado)).resolves.toEqual(criarCarta('7', '♦'));
  await expect(fria.decidirJogada(mao, estado)).resolves.toEqual(criarCarta('9', '♦'));
}

async function registraSeguirFriaSemFuga(): Promise<void> {
  const estado = criarEstado({
    mesa: [
      { jogadorId: 'j1', carta: criarCarta('4', '♣') },
      { jogadorId: 'j2', carta: criarCarta('4', '♥') },
    ],
    declaracoes: { bot: 1 },
    vazas: { bot: 1 },
    manilha: '6',
  });
  const mao = [criarCarta('5', '♦'), criarCarta('8', '♦'), criarCarta('K', '♦')];
  const jogadas: DecisaoJogadaDebug[] = [];
  const bot = criarBot(1, 0, {
    registrarDeclaracao: () => undefined,
    registrarJogada: (jogada) => jogadas.push(jogada),
  });

  await bot.decidirJogada(mao, estado);

  expect(jogadas[0]?.quente?.motivo).toBe('linha quente segue fria: sem carta que não faz');
  expect(jogadas[0]?.quente?.caminho).toEqual(['jogada', 'joga no meio', 'linha quente', 'segue fria']);
}

async function convergeSemPressao(): Promise<void> {
  const estado = criarEstado({ mesa: mesaComBaixa(), declaracoes: { j2: 1, bot: 1 }, vazas: { j2: 0, bot: 0 } });
  const mao = [criarCarta('A', '♦'), criarCarta('3', '♦')];
  const bot = criarBot(1, 0);
  const fria = new DecisorJogadaLinhaFria();

  await expect(bot.decidirJogada(mao, estado)).resolves.toEqual(await fria.decidirJogada(mao, estado));
}

async function naoSorteiaSemBifurcacao(): Promise<void> {
  const estado = criarEstado({ mesa: [{ jogadorId: 'j1', carta: criarCarta('8', '♣') }], declaracoes: { bot: 1 } });
  const jogadas: DecisaoJogadaDebug[] = [];
  const random = vi.fn(() => 0);
  const bot = new DecisorJogadaLinhaQuente({
    temperatura: 1,
    rng: { random },
    logger: { registrarDeclaracao: () => undefined, registrarJogada: (jogada) => jogadas.push(jogada) },
  });

  await bot.decidirJogada([criarCarta('A', '♦'), criarCarta('3', '♦')], estado);

  expect(random).not.toHaveBeenCalled();
  expect(jogadas[0]?.quente?.caminho).toEqual(['jogada', 'joga no meio', 'linha quente']);
}

async function repeteEscolhaDeterministica(): Promise<void> {
  const estado = criarEstado(cenarioBifurcacao());
  const primeiro = await criarBot(0.5, 0.4).decidirJogada(maoBifurcacao(), estado);
  const segundo = await criarBot(0.5, 0.4).decidirJogada(maoBifurcacao(), estado);

  expect(primeiro).toEqual(segundo);
}

function criarBot(temperatura: number, valorRng: number, logger?: LoggerDebugBot): DecisorJogadaLinhaQuente {
  return new DecisorJogadaLinhaQuente({
    temperatura,
    rng: { random: () => valorRng },
    logger,
  });
}

function decisaoSorteadaLinhaQuente(): Partial<DecisaoJogadaDebug> {
  return {
    carta: criarCarta('4', '♦'),
    linhaFria: criarCarta('3', '♦'),
    linhaQuente: criarCarta('4', '♦'),
    sorteio: 0,
    escolheuQuente: true,
  };
}
