import type { Scene } from 'phaser';
import type { Partida } from '@/core/Partida';
import { estadoEmJogo } from '@/types/estado-rodada';
import { desenharManilha, limparManilha } from '../renderers/manilha-renderer';

export function atualizarManilhaDaCena(
  cena: Scene,
  partida: Partida | undefined,
  objetos: Phaser.GameObjects.GameObject[],
): void {
  limparManilha(objetos);
  const estado = partida?.estado;
  if (!estado || estado.fase === 'distribuindo') return;
  const { cartaVirada, manilha } = estadoEmJogo(estado);
  if (!cartaVirada) return;
  desenharManilha({ cena, cartaVirada, manilha, objetos });
}
