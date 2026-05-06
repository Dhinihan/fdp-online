import { vi } from 'vitest';
import type { Carta } from '@/core/Carta';
import type { DecisorDeclaracao } from '@/core/portas/DecisorDeclaracao';
import type { DecisorJogada } from '@/core/portas/DecisorJogada';
import { Rodada } from '@/core/Rodada';
import { createEmissorEventos } from '@/store/emissor-eventos';
import type { Jogador } from '@/types/entidades';
import type { EstadoRodada } from '@/types/estado-rodada';

export function criarCarta(valor: Carta['valor'], naipe: Carta['naipe']): Carta {
  return { valor, naipe };
}

export function criarJogador(id: string, nome: string): Jogador {
  return { id, nome, pontos: 5 };
}

export function criarDecisor(carta: Carta): DecisorJogada {
  const mock = vi.fn<(mao: Carta[], estado: unknown) => Promise<Carta>>().mockResolvedValue(carta);
  return { decidirJogada: mock };
}

export function criarDecisorPrimeiraCarta(): DecisorJogada {
  const mock = vi.fn<(mao: Carta[], estado: unknown) => Promise<Carta>>();
  mock.mockImplementation((mao: Carta[]) => Promise.resolve(mao[0]));
  return { decidirJogada: mock };
}

export function criarDecisorSequencia(cartas: Carta[]): DecisorJogada {
  let indice = 0;
  const mock = vi.fn<(mao: Carta[], estado: unknown) => Promise<Carta>>();
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
  const estado = (rodada as unknown as EstadoPrivado)._estado;
  estado.fase = 'aguardandoJogada';
  estado.declaracoes = {};
  return rodada;
}

interface EstadoPrivado {
  _estado: EstadoRodada;
}

export function criarRodadaComMao(config: {
  jogadores: Jogador[];
  decisores: Map<string, DecisorJogada>;
  emissor: ReturnType<typeof createEmissorEventos>;
  maos: Carta[][];
  jogadorAtual?: number;
  fase?: EstadoRodada['fase'];
  turno?: number;
  cartasPorRodada?: number;
  manilha?: Carta['valor'];
  declaracoes?: Record<string, number>;
}): Rodada {
  const rodada = new Rodada(config.jogadores, config.emissor, {
    jogada: config.decisores,
    declaracao: new Map<string, DecisorDeclaracao>(),
  });
  const estado = (rodada as unknown as EstadoPrivado)._estado;
  estado.maos = config.jogadores.map((jogador, i) => ({
    jogador,
    cartas: config.maos[i] ?? [],
    visivel: jogador.id === 'humano',
  }));
  estado.fase = config.fase ?? 'aguardandoJogada';
  estado.jogadorAtual = config.jogadorAtual ?? 0;
  estado.turno = config.turno ?? 1;
  estado.cartasPorRodada = config.cartasPorRodada ?? 4;
  estado.manilha = config.manilha ?? '3';
  estado.declaracoes = config.declaracoes ?? {};
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
