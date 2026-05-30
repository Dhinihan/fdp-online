import { DecisorJogadaPorTemperatura } from '@/adapters/bots/DecisorJogadaPorTemperatura';
import type { DecisaoJogadaDebug, LoggerDebugBot } from '@/adapters/bots/logger-debug-bot';
import type { Carta } from '@/core/Carta';
import type { Jogador } from '@/types/entidades';
import type { EstadoEmJogo, MesaItem } from '@/types/estado-rodada';
import { criarCarta, criarJogador } from '../core/rodada-fixtures';

export function criarBotLinhaQuente(
  temperatura: number,
  valorRng: number,
  logger?: LoggerDebugBot,
): DecisorJogadaPorTemperatura {
  return new DecisorJogadaPorTemperatura({
    temperatura,
    rng: { random: () => valorRng },
    logger,
  });
}

export function decisaoSorteadaLinhaQuente(): Partial<DecisaoJogadaDebug> {
  return {
    carta: criarCarta('4', '♦'),
    linhaFria: criarCarta('3', '♦'),
    linhaQuente: criarCarta('4', '♦'),
    sorteio: 0,
    escolheuQuente: true,
  };
}

export function criarEstado(config: Partial<EstadoEmJogo>): EstadoEmJogo {
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

export function cenarioBifurcacao(): Partial<EstadoEmJogo> {
  return {
    mesa: mesaComQuatro(),
    declaracoes: { j1: 0, j2: 1, bot: 1 },
    vazas: { j1: 0, j2: 0, bot: 0 },
    cartasReveladas: cartasQueGarantemTresDeOuros(),
  };
}

export function cenarioBifurcacaoAntesDoFim(): Partial<EstadoEmJogo> {
  return {
    ...cenarioBifurcacao(),
    mesa: [
      { jogadorId: 'j1', carta: criarCarta('4', '♣') },
      { jogadorId: 'j2', carta: criarCarta('4', '♥') },
    ],
  };
}

export function maoBifurcacao(): Carta[] {
  return [criarCarta('3', '♦'), criarCarta('4', '♦')];
}

export function mesaComBaixa(): MesaItem[] {
  return [
    { jogadorId: 'j1', carta: criarCarta('8', '♣') },
    { jogadorId: 'j2', carta: criarCarta('4', '♥') },
    { jogadorId: 'j3', carta: criarCarta('6', '♠') },
  ];
}

export function mesaComDois(): MesaItem[] {
  return [
    { jogadorId: 'j1', carta: criarCarta('2', '♣') },
    { jogadorId: 'j2', carta: criarCarta('7', '♥') },
    { jogadorId: 'j3', carta: criarCarta('8', '♠') },
  ];
}

export function mesaComQuatro(): MesaItem[] {
  return [
    { jogadorId: 'j1', carta: criarCarta('4', '♣') },
    { jogadorId: 'j2', carta: criarCarta('4', '♥') },
    { jogadorId: 'j3', carta: criarCarta('4', '♠') },
  ];
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
