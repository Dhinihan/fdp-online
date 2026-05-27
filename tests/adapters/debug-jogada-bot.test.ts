import { describe, expect, it } from 'vitest';
import {
  criarCaminhoJogadaDebug,
  criarContextoJogadaDebug,
  criarLinhaJogadaDebug,
} from '@/adapters/bots/debug-jogada-bot';
import type { Jogador } from '@/types/entidades';
import type { EstadoEmJogo, MesaItem } from '@/types/estado-rodada';
import { criarCarta, criarJogador } from '../core/rodada-fixtures';

describe('debug da jogada dos bots', () => {
  it('deve descrever abertura com jogadores por agir em ordem circular', deveDescreverAbertura);
  it('deve descrever jogada no meio com líder e interessados por agir', deveDescreverMeio);
  it('deve descrever fechamento sem jogadores por agir', deveDescreverFechamento);
  it('deve criar caminho canônico com etapa opcional', deveCriarCaminhoCanonico);
  it('deve criar linha com motivo padrão quando motivo não foi registrado', deveCriarLinhaComMotivoPadrao);
});

function deveDescreverAbertura(): void {
  const estado = criarEstado({
    jogadorAtual: 1,
    mesa: [],
    declaracoes: { bot: 2, j1: 0, j3: 1, j4: 0 },
    vazas: { bot: 0, j1: 0, j3: 0, j4: 0 },
  });

  expect(criarContextoJogadaDebug(estado, 3)).toMatchObject({
    posicaoMesa: 'abre',
    necessidade: 2,
    urgencia: 2 / 3,
    urgenciaAlta: true,
    jogadoresPorAgir: 3,
    liderId: null,
    liderNecessidade: null,
    jogadoresInteressadosPorAgir: 1,
  });
}

function deveDescreverMeio(): void {
  const estado = criarEstado({
    jogadorAtual: 1,
    mesa: [{ jogadorId: 'j1', carta: criarCarta('K', '♣') }],
    declaracoes: { j1: 2, bot: 1, j3: 1, j4: 0 },
    vazas: { j1: 1, bot: 0, j3: 0, j4: 0 },
  });

  expect(criarContextoJogadaDebug(estado, 2)).toMatchObject({
    posicaoMesa: 'meio',
    necessidade: 1,
    urgencia: 0.5,
    urgenciaAlta: false,
    jogadoresPorAgir: 2,
    liderId: 'j1',
    liderNecessidade: 1,
    jogadoresInteressadosPorAgir: 1,
  });
}

function deveDescreverFechamento(): void {
  const estado = criarEstado({
    jogadorAtual: 1,
    mesa: mesaComTres(),
    declaracoes: { bot: 0, j2: 1 },
    vazas: { bot: 1, j2: 0 },
  });

  expect(criarContextoJogadaDebug(estado, 1)).toMatchObject({
    posicaoMesa: 'fecha',
    necessidade: -1,
    urgencia: -1,
    urgenciaAlta: false,
    jogadoresPorAgir: 0,
    jogadoresInteressadosPorAgir: 0,
  });
}

function deveCriarLinhaComMotivoPadrao(): void {
  const carta = criarCarta('4', '♦');

  expect(criarLinhaJogadaDebug(carta, undefined, ['jogada', 'linha fria'])).toEqual({
    carta,
    motivo: 'motivo não registrado',
    caminho: ['jogada', 'linha fria'],
  });
}

function deveCriarCaminhoCanonico(): void {
  expect(criarCaminhoJogadaDebug('meio', 'quente', 'escolha direta')).toEqual([
    'jogada',
    'joga no meio',
    'linha quente',
    'escolha direta',
  ]);
  expect(criarCaminhoJogadaDebug('fecha', 'fria')).toEqual(['jogada', 'fecha a mesa', 'linha fria']);
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
  return [criarJogador('j1', 'J1'), criarJogador('bot', 'Bot'), criarJogador('j3', 'J3'), criarJogador('j4', 'J4')];
}

function mesaComTres(): MesaItem[] {
  return [
    { jogadorId: 'j1', carta: criarCarta('4', '♣') },
    { jogadorId: 'j2', carta: criarCarta('K', '♥') },
    { jogadorId: 'j3', carta: criarCarta('8', '♠') },
  ];
}
