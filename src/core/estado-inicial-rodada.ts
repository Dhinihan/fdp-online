import type { Jogador } from '@/types/entidades';
import type { EstadoMutavel } from '@/types/estado-rodada';

export function criarEstadoInicialRodada(jogadores: Jogador[], jogadorInicial: number): EstadoMutavel {
  return {
    fase: 'distribuindo',
    jogadorAtual: jogadorInicial,
    mesa: [],
    cartasReveladas: [],
    maos: [],
    vazas: {},
    turno: 1,
    cartasPorRodada: 0,
    manilha: '3',
    cartaVirada: null,
    declaracoes: {},
    pontos: Object.fromEntries(jogadores.map((jogador) => [jogador.id, jogador.pontos])),
  };
}
