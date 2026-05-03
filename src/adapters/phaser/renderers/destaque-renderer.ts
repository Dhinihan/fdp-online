import type { Scene } from 'phaser';
import { LARGURA, ALTURA, RAIO } from './carta-renderer';

export interface EstadoDestaque {
  container?: Phaser.GameObjects.Container;
  highlight?: Phaser.GameObjects.Graphics;
}

export function destacarCarta(cena: Scene, container: Phaser.GameObjects.Container, estado: EstadoDestaque): void {
  removerDestaque(estado);
  estado.container = container;
  container.setScale(1.1);

  if (!estado.highlight) {
    estado.highlight = cena.add.graphics();
  }
  estado.highlight.clear();
  estado.highlight.lineStyle(3, 0xffff00, 1);
  estado.highlight.strokeRoundedRect(
    container.x - LARGURA / 2 - 4,
    container.y - ALTURA / 2 - 4,
    LARGURA + 8,
    ALTURA + 8,
    RAIO + 2,
  );
}

export function removerDestaque(estado: EstadoDestaque): void {
  if (estado.container) {
    estado.container.setScale(1);
    estado.container = undefined;
  }
  if (estado.highlight) {
    estado.highlight.clear();
  }
}

export function destruirDestaque(estado: EstadoDestaque): void {
  if (estado.highlight) {
    estado.highlight.destroy();
    estado.highlight = undefined;
  }
  estado.container = undefined;
}
