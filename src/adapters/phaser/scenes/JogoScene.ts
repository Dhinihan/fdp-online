import { Scene } from 'phaser';
import type { GameObjects } from 'phaser';

type Graphics = GameObjects.Graphics;
type Text = GameObjects.Text;

export class JogoScene extends Scene {
  private graficos?: Graphics;
  private textoDaCarta?: Text;

  constructor() {
    super({ key: 'JogoScene' });
  }

  create(): void {
    this.criarCartaPlaceholder();
    this.scale.on('resize', this.redesenhar);
  }

  shutdown(): void {
    this.scale.off('resize', this.redesenhar);
  }

  private redesenhar = (): void => {
    this.graficos?.destroy();
    this.textoDaCarta?.destroy();
    this.criarCartaPlaceholder();
  };

  private criarCartaPlaceholder(): void {
    const centroX = this.cameras.main.centerX;
    const centroY = this.cameras.main.centerY;

    const largura = 80;
    const altura = 120;
    const raio = 8;

    const x = centroX - largura / 2;
    const y = centroY - altura / 2;

    this.graficos = this.add.graphics();

    this.graficos.fillStyle(0xffffff, 1);
    this.graficos.fillRoundedRect(x, y, largura, altura, raio);

    this.graficos.lineStyle(2, 0x333333, 1);
    this.graficos.strokeRoundedRect(x, y, largura, altura, raio);

    this.textoDaCarta = this.add
      .text(centroX, centroY, 'A\u2660', {
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#000000',
      })
      .setOrigin(0.5);
  }
}
