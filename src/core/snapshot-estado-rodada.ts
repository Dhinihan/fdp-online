import type { EstadoMutavel, EstadoRodada, MaoJogador, MesaItem } from '@/types/estado-rodada';
import type { Carta } from './Carta';

export function criarSnapshotEstadoRodada(estado: EstadoMutavel): EstadoRodada {
  if (estado.fase === 'distribuindo') {
    return { fase: 'distribuindo', jogadorAtual: estado.jogadorAtual, pontos: { ...estado.pontos } };
  }
  return {
    ...estado,
    pontos: { ...estado.pontos },
    declaracoes: { ...estado.declaracoes },
    vazas: { ...estado.vazas },
    cartaVirada: clonarCartaOuNula(estado.cartaVirada),
    maos: estado.maos.map(clonarMao),
    mesa: estado.mesa.map(clonarMesaItem),
  };
}

function clonarMao(mao: MaoJogador): MaoJogador {
  return {
    jogador: { ...mao.jogador },
    cartas: mao.cartas.map(clonarCarta),
    visivel: mao.visivel,
  };
}

function clonarMesaItem(item: MesaItem): MesaItem {
  return { jogadorId: item.jogadorId, carta: clonarCarta(item.carta) };
}

function clonarCartaOuNula(carta: Carta | null): Carta | null {
  return carta ? clonarCarta(carta) : null;
}

function clonarCarta(carta: Carta): Carta {
  return { ...carta };
}
