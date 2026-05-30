import type { Carta } from '@/core/Carta';
import type { EstadoEmJogo, MesaItem } from '@/types/estado-rodada';
import { criarCarta, criarJogador } from '../core/rodada-fixtures';

export function criarEstadoLinhaFria(config: Partial<EstadoEmJogo>): EstadoEmJogo {
  const jogadores = ['j1', 'j2', 'j3', 'bot'].map((id) => criarJogador(id, id === 'bot' ? 'Bot' : id.toUpperCase()));
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

export function criarEstadoComUmPorAgir(config: Partial<EstadoEmJogo>): EstadoEmJogo {
  return criarEstadoLinhaFria({
    jogadorAtual: 1,
    mesa: [
      { jogadorId: 'j1', carta: criarCarta('8', '♣') },
      { jogadorId: 'bot', carta: criarCarta('6', '♣') },
    ],
    manilha: '5',
    ...config,
  });
}

export function criarEstadoComDoisPorAgir(config: Partial<EstadoEmJogo>): EstadoEmJogo {
  return criarEstadoLinhaFria({
    jogadorAtual: 1,
    mesa: [{ jogadorId: 'j1', carta: criarCarta('8', '♣') }],
    manilha: '5',
    ...config,
  });
}

export function mesaComK(): MesaItem[] {
  return [
    { jogadorId: 'j1', carta: criarCarta('K', '♣') },
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

export function cartasQueGarantemTresDeOuros(): Carta[] {
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

export const ETAPA_GUARDA_BLOQUEOU = 'guarda de posição bloqueou';

export const ETAPA_GUARDA_PERMITIU = 'guarda de posição permitiu';

export const ETAPA_JA_CUMPRIU = 'já cumpriu';

export const ETAPA_FECHA_PRECISA = 'precisa fazer';

export const ETAPA_FECHA_JA_CUMPRIU = 'já cumpriu';

/** Caminhos completos para testes de integração via DecisorJogadaPorTemperatura. */
export const CAMINHO_GUARDA_BLOQUEOU = ['jogada', 'joga no meio', 'linha fria', ETAPA_GUARDA_BLOQUEOU] as const;

export const CAMINHO_GUARDA_PERMITIU = ['jogada', 'joga no meio', 'linha fria', ETAPA_GUARDA_PERMITIU] as const;

export const CAMINHO_JA_CUMPRIU = ['jogada', 'joga no meio', 'linha fria', ETAPA_JA_CUMPRIU] as const;

export const CAMINHO_FECHA_PRECISA = ['jogada', 'fecha a mesa', 'linha fria', ETAPA_FECHA_PRECISA] as const;

export const CAMINHO_FECHA_JA_CUMPRIU = ['jogada', 'fecha a mesa', 'linha fria', ETAPA_FECHA_JA_CUMPRIU] as const;
