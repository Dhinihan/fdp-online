import { Scene } from 'phaser';
import type { GameObjects } from 'phaser';
import { criarDebounceResize, type ResizeDebouncer } from '../redimensionamento';

type Graphics = GameObjects.Graphics;
type Text = GameObjects.Text;

export class JogoScene extends Scene {
  private graficos?: Graphics;
  private textoDaCarta?: Text;
  private redesenhar?: ResizeDebouncer;

  constructor() {
    super({ key: 'JogoScene' });
  }

  create(): void {
    this.criarCartaPlaceholder();

    this.redesenhar = criarDebounceResize(this, () => {
      this.graficos?.destroy();
      this.textoDaCarta?.destroy();
      this.criarCartaPlaceholder();
    });

    this.scale.on('resize', this.redesenhar);
    this.events.on('shutdown', () => {
      this.shutdown();
    });
  }

  shutdown(): void {
    if (this.redesenhar) {
      this.scale.off('resize', this.redesenhar);
      this.redesenhar.limpar();
    }
  }

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
