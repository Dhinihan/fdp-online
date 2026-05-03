import { vi } from 'vitest';
import type { Carta } from '@/core/Carta';
import { Partida } from '@/core/Partida';
import type { DecisorJogada } from '@/core/portas/DecisorJogada';
import { createEmissorEventos } from '@/store/emissor-eventos';
import type { Jogador } from '@/types/entidades';
import type { EstadoPartida } from '@/types/estado-partida';

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

export function criarPartida(config: {
  jogadores: Jogador[];
  decisores: Map<string, DecisorJogada>;
  emissor: ReturnType<typeof createEmissorEventos>;
  cartasPorRodada?: number;
}): Partida {
  const partida = new Partida(config.jogadores, config.decisores, config.emissor);
  partida.distribuir(config.cartasPorRodada ?? 1);
  return partida;
}

interface EstadoPrivado {
  _estado: EstadoPartida;
}

export function criarPartidaComMao(config: {
  jogadores: Jogador[];
  decisores: Map<string, DecisorJogada>;
  emissor: ReturnType<typeof createEmissorEventos>;
  maos: Carta[][];
  jogadorAtual?: number;
  fase?: EstadoPartida['fase'];
  turno?: number;
  cartasPorRodada?: number;
}): Partida {
  const partida = new Partida(config.jogadores, config.decisores, config.emissor);
  const estado = (partida as unknown as EstadoPrivado)._estado;
  estado.maos = config.jogadores.map((jogador, i) => ({
    jogador,
    cartas: config.maos[i] ?? [],
    visivel: jogador.id === 'humano',
  }));
  estado.fase = config.fase ?? 'aguardandoJogada';
  estado.jogadorAtual = config.jogadorAtual ?? 0;
  estado.vazas = {};
  estado.turno = config.turno ?? 1;
  estado.cartasPorRodada = config.cartasPorRodada ?? 4;
  return partida;
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
