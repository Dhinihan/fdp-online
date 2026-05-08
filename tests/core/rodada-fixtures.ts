import { vi } from 'vitest';
import type { Carta } from '@/core/Carta';
import type { DecisorDeclaracao } from '@/core/portas/DecisorDeclaracao';
import type { DecisorJogada } from '@/core/portas/DecisorJogada';
import { Rodada } from '@/core/Rodada';
import { createEmissorEventos } from '@/store/emissor-eventos';
import type { Jogador } from '@/types/entidades';
import type { EstadoMutavel, EstadoRodada, FaseComCartas } from '@/types/estado-rodada';

export function criarCarta(valor: Carta['valor'], naipe: Carta['naipe']): Carta {
  return { valor, naipe };
}

export function criarJogador(id: string, nome: string): Jogador {
  return { id, nome, pontos: 5 };
}

export function criarDecisor(carta: Carta): DecisorJogada {
  const mock = vi.fn<(mao: Carta[], estado: EstadoRodada) => Promise<Carta>>().mockResolvedValue(carta);
  return { decidirJogada: mock };
}

export function criarDecisorPrimeiraCarta(): DecisorJogada {
  const mock = vi.fn<(mao: Carta[], estado: EstadoRodada) => Promise<Carta>>();
  mock.mockImplementation((mao: Carta[]) => Promise.resolve(mao[0]));
  return { decidirJogada: mock };
}

export function criarDecisorSequencia(cartas: Carta[]): DecisorJogada {
  let indice = 0;
  const mock = vi.fn<(mao: Carta[], estado: EstadoRodada) => Promise<Carta>>();
  mock.mockImplementation(() => {
    const carta = cartas[indice];
    indice += 1;
    return Promise.resolve(carta);
  });
  return { decidirJogada: mock };
}

export function criarRodada(config: {
  jogadores: Jogador[];
  decisores: Map<string, DecisorJogada>;
  emissor: ReturnType<typeof createEmissorEventos>;
  cartasPorRodada?: number;
  decisoresDeclaracao?: Map<string, DecisorDeclaracao>;
}): Rodada {
  const rodada = new Rodada(config.jogadores, config.emissor, {
    jogada: config.decisores,
    declaracao: config.decisoresDeclaracao ?? new Map<string, DecisorDeclaracao>(),
  });
  rodada.distribuir(config.cartasPorRodada ?? 1);
  rodada.restaurarEstado({
    ...rodada.estado,
    fase: 'aguardandoJogada',
    declaracoes: {},
  } as EstadoMutavel);
  return rodada;
}

function pontosIniciais(jogadores: Jogador[]): Record<string, number> {
  return Object.fromEntries(jogadores.map((jogador) => [jogador.id, jogador.pontos]));
}

function criarEstadoComMao(config: ConfigRodadaComMao): EstadoMutavel {
  return {
    maos: config.jogadores.map((jogador, i) => ({
      jogador,
      cartas: config.maos[i] ?? [],
      visivel: jogador.id === 'humano',
    })),
    fase: config.fase ?? 'aguardandoJogada',
    jogadorAtual: config.jogadorAtual ?? 0,
    turno: config.turno ?? 1,
    cartasPorRodada: config.cartasPorRodada ?? 4,
    manilha: config.manilha ?? '3',
    declaracoes: config.declaracoes ?? {},
    pontos: config.pontos ?? pontosIniciais(config.jogadores),
    vazas: config.vazas ?? {},
    mesa: [],
    cartaVirada: null,
  };
}

interface ConfigRodadaComMao {
  jogadores: Jogador[];
  decisores: Map<string, DecisorJogada>;
  emissor: ReturnType<typeof createEmissorEventos>;
  maos: Carta[][];
  jogadorAtual?: number;
  fase?: FaseComCartas;
  turno?: number;
  cartasPorRodada?: number;
  manilha?: Carta['valor'];
  declaracoes?: Record<string, number>;
  pontos?: Record<string, number>;
  vazas?: Record<string, number>;
}

export function criarRodadaComMao(config: ConfigRodadaComMao): Rodada {
  const rodada = new Rodada(config.jogadores, config.emissor, {
    jogada: config.decisores,
    declaracao: new Map<string, DecisorDeclaracao>(),
  });
  rodada.restaurarEstado(criarEstadoComMao(config));
  return rodada;
}

export function jogadoresPadrao(): Jogador[] {
  return [criarJogador('j1', 'J1'), criarJogador('j2', 'J2'), criarJogador('j3', 'J3'), criarJogador('j4', 'J4')];
}

export function decisoresPorMaos(jogadores: Jogador[], maos: Carta[][]): Map<string, DecisorJogada> {
  return new Map(jogadores.map((j) => [j.id, criarDecisor(maos[jogadores.indexOf(j)][0])]));
}

export function decisoresPrimeiraCarta(jogadores: Jogador[]): Map<string, DecisorJogada> {
  return new Map(jogadores.map((j) => [j.id, criarDecisorPrimeiraCarta()]));
}
