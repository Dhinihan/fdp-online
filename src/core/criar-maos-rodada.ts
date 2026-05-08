import type { Jogador } from '@/types/entidades';
import type { MaoJogador } from '@/types/estado-rodada';
import type { Carta } from './Carta';

export function criarMaosRodada(jogadores: Jogador[], cartas: Carta[][], primeiraRodada: boolean): MaoJogador[] {
  return jogadores.map((jogador, i) => ({
    jogador,
    cartas: cartas[i],
    visivel: primeiraRodada ? jogador.id !== 'humano' : jogador.id === 'humano',
  }));
}
