import type { Scene } from 'phaser';
import { escalar } from '../escala';
import { LARGURA, ALTURA, RAIO } from './carta-renderer';

export interface EstadoDestaque {
  container?: Phaser.GameObjects.Container;
  highlight?: Phaser.GameObjects.Graphics;
  profundidadeOriginal?: number;
}

export function destacarCarta(cena: Scene, container: Phaser.GameObjects.Container, estado: EstadoDestaque): void {
  removerDestaque(estado);
  estado.container = container;
  estado.profundidadeOriginal = container.depth;
  container.setDepth(100);
  container.setScale(1.1);

  if (!estado.highlight) {
    estado.highlight = cena.add.graphics();
  }
  estado.highlight.setDepth(101);
  estado.highlight.clear();

  const largura = escalar(LARGURA, cena);
  const altura = escalar(ALTURA, cena);
  const raio = escalar(RAIO, cena);
  const offset = escalar(4, cena);
  const espessura = escalar(3, cena);

  estado.highlight.lineStyle(espessura, 0xffff00, 1);
  estado.highlight.strokeRoundedRect(
    container.x - largura / 2 - offset,
    container.y - altura / 2 - offset,
    largura + offset * 2,
    altura + offset * 2,
    raio + escalar(2, cena),
  );
}

export function removerDestaque(estado: EstadoDestaque): void {
  if (estado.container) {
    if (estado.profundidadeOriginal !== undefined) {
      estado.container.setDepth(estado.profundidadeOriginal);
    }
    estado.container.setScale(1);
    estado.container = undefined;
  }
  if (estado.highlight) {
    estado.highlight.clear();
  }
  estado.profundidadeOriginal = undefined;
}

export function destruirDestaque(estado: EstadoDestaque): void {
  if (estado.highlight) {
    estado.highlight.destroy();
    estado.highlight = undefined;
  }
  estado.container = undefined;
  estado.profundidadeOriginal = undefined;
}
