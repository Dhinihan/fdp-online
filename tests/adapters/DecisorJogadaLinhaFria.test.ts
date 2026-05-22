import { describe, expect, it } from 'vitest';
import { DecisorJogadaLinhaFria, decidirUltimoLinhaFria } from '@/adapters/bots/DecisorJogadaLinhaFria';
import type { Carta } from '@/core/Carta';
import type { EstadoEmJogo, MesaItem } from '@/types/estado-rodada';
import { criarCarta, criarJogador } from '../core/rodada-fixtures';

describe('DecisorJogadaLinhaFria', () => {
  it('deve escolher G[N-X] quando precisa fazer e tem ganhadoras suficientes', deveEscolherGanhadoraPorNecessidade);
  it('deve escolher a ganhadora mais fraca quando ganhadoras são escassas', deveEscolherGanhadoraEscassa);
  it('deve escolher P[N-X] quando precisa fazer mas não consegue agora', deveEscolherPerdedoraPorNecessidade);
  it('deve escolher a perdedora mais fraca quando todas são candidatas futuras', deveEscolherPerdedoraEscassa);
  it('não deve tratar empate como carta que faz a vaza', deveRejeitarEmpateComoVitoria);
  it('deve ordenar ganhadoras por força real com manilha e desempate por naipe', deveOrdenarPorForcaReal);
  it('deve expor árvore fria de último com carta e motivo', deveExporArvoreFriaDeUltimo);
  it('deve fazer sem desperdiçar carta garantida quando ainda não é o último', devePreservarGarantida);
  it('deve seguir fuga do fim sem considerar necessidade do líder', deveIgnorarNecessidadeDoLiderNoFim);
  it('deve decidir abertura cautelosamente quando a mesa está vazia', deveDecidirAbertura);
});

async function deveEscolherGanhadoraPorNecessidade(): Promise<void> {
  const estado = criarEstado({ mesa: mesaComQuatro(), declaracoes: { bot: 2 }, vazas: { bot: 0 }, manilha: '6' });
  const bot = new DecisorJogadaLinhaFria();

  await expect(
    bot.decidirJogada([criarCarta('5', '♦'), criarCarta('8', '♦'), criarCarta('K', '♦')], estado),
  ).resolves.toEqual(criarCarta('8', '♦'));
}

async function deveEscolherGanhadoraEscassa(): Promise<void> {
  const estado = criarEstado({ mesa: mesaComQuatro(), declaracoes: { bot: 4 }, vazas: { bot: 0 }, manilha: '6' });
  const bot = new DecisorJogadaLinhaFria();

  await expect(
    bot.decidirJogada([criarCarta('5', '♦'), criarCarta('8', '♦'), criarCarta('K', '♦')], estado),
  ).resolves.toEqual(criarCarta('5', '♦'));
}

async function deveEscolherPerdedoraPorNecessidade(): Promise<void> {
  const estado = criarEstado({ mesa: mesaComK(), declaracoes: { bot: 2 }, vazas: { bot: 0 }, manilha: '5' });
  const bot = new DecisorJogadaLinhaFria();

  await expect(
    bot.decidirJogada([criarCarta('4', '♦'), criarCarta('6', '♦'), criarCarta('9', '♦'), criarCarta('Q', '♦')], estado),
  ).resolves.toEqual(criarCarta('9', '♦'));
}

async function deveEscolherPerdedoraEscassa(): Promise<void> {
  const estado = criarEstado({ mesa: mesaComK(), declaracoes: { bot: 2 }, vazas: { bot: 0 }, manilha: '5' });
  const bot = new DecisorJogadaLinhaFria();

  await expect(bot.decidirJogada([criarCarta('4', '♦'), criarCarta('6', '♦')], estado)).resolves.toEqual(
    criarCarta('4', '♦'),
  );
}

async function deveRejeitarEmpateComoVitoria(): Promise<void> {
  const estado = criarEstado({
    mesa: [{ jogadorId: 'j1', carta: criarCarta('K', '♣') }],
    declaracoes: { bot: 1 },
    vazas: { bot: 0 },
    manilha: '5',
  });
  const bot = new DecisorJogadaLinhaFria();

  await expect(bot.decidirJogada([criarCarta('K', '♦'), criarCarta('A', '♦')], estado)).resolves.toEqual(
    criarCarta('A', '♦'),
  );
}

async function deveOrdenarPorForcaReal(): Promise<void> {
  const estado = criarEstado({ mesa: mesaComK(), declaracoes: { bot: 1 }, vazas: { bot: 0 }, manilha: '5' });
  const bot = new DecisorJogadaLinhaFria();

  await expect(bot.decidirJogada([criarCarta('5', '♦'), criarCarta('5', '♣')], estado)).resolves.toEqual(
    criarCarta('5', '♣'),
  );
}

function deveExporArvoreFriaDeUltimo(): void {
  const cenarioG = criarEstado({ mesa: mesaComQuatro(), declaracoes: { bot: 2 }, vazas: { bot: 0 }, manilha: '6' });
  const cenarioP = criarEstado({ mesa: mesaComK(), declaracoes: { bot: 2 }, vazas: { bot: 0 }, manilha: '5' });
  const estado = criarEstado({ mesa: mesaComK(), declaracoes: { bot: 1 }, vazas: { bot: 1 }, manilha: '5' });
  const impossivel = criarEstado({ mesa: mesaComQuatro(), declaracoes: { bot: 1 }, vazas: { bot: 1 }, manilha: '6' });

  expect(decidirUltimoLinhaFria([criarCarta('5', '♦'), criarCarta('8', '♦'), criarCarta('K', '♦')], cenarioG)).toEqual({
    carta: criarCarta('8', '♦'),
    motivo: 'precisa fazer; regra G[N-X]',
  });
  expect(
    decidirUltimoLinhaFria(
      [criarCarta('4', '♦'), criarCarta('6', '♦'), criarCarta('9', '♦'), criarCarta('Q', '♦')],
      cenarioP,
    ),
  ).toEqual({ carta: criarCarta('9', '♦'), motivo: 'precisa fazer sem carta que vence; regra P[N-X]' });
  expect(decidirUltimoLinhaFria([criarCarta('Q', '♦'), criarCarta('K', '♦')], estado)).toEqual({
    carta: criarCarta('K', '♦'),
    motivo: 'já cumpriu; carta mais alta que não faz',
  });
  expect(
    decidirUltimoLinhaFria([criarCarta('5', '♦'), criarCarta('8', '♦'), criarCarta('K', '♦')], impossivel),
  ).toEqual({
    carta: criarCarta('K', '♦'),
    motivo: 'já cumpriu; fuga impossível',
  });
}

async function devePreservarGarantida(): Promise<void> {
  const estado = criarEstado(cenarioGarantida());
  const bot = new DecisorJogadaLinhaFria();

  await expect(bot.decidirJogada([criarCarta('6', '♦'), criarCarta('3', '♦')], estado)).resolves.toEqual(
    criarCarta('6', '♦'),
  );
}

async function deveIgnorarNecessidadeDoLiderNoFim(): Promise<void> {
  const estado = criarEstado({ mesa: mesaComK(), declaracoes: { j1: 1, bot: 0 }, vazas: { j1: 0, bot: 0 } });
  const bot = new DecisorJogadaLinhaFria();

  await expect(bot.decidirJogada([criarCarta('4', '♦'), criarCarta('Q', '♠')], estado)).resolves.toEqual(
    criarCarta('Q', '♠'),
  );
}

function criarEstado(config: Partial<EstadoEmJogo>): EstadoEmJogo {
  const jogadores = [
    criarJogador('j1', 'J1'),
    criarJogador('j2', 'J2'),
    criarJogador('j3', 'J3'),
    criarJogador('bot', 'Bot'),
  ];
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

async function deveDecidirAbertura(): Promise<void> {
  const estado = criarEstado({
    mesa: [],
    declaracoes: { bot: 0 },
    vazas: { bot: 0 },
    cartasReveladas: cartasQueGarantemTresDeOuros(),
  });
  const bot = new DecisorJogadaLinhaFria();
  const mao = [criarCarta('3', '♦'), criarCarta('8', '♦')];

  await expect(bot.decidirJogada(mao, estado)).resolves.toEqual(criarCarta('8', '♦'));
}
