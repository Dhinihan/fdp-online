import { Scene } from 'phaser';

export class JogoScene extends Scene {
  constructor() {
    super({ key: 'JogoScene' });
  }

  create(): void {
    this.criarCartaPlaceholder();
  }

  private criarCartaPlaceholder(): void {
    const centroX = this.cameras.main.centerX;
    const centroY = this.cameras.main.centerY;

    const largura = 80;
    const altura = 120;
    const raio = 8;

    const x = centroX - largura / 2;
    const y = centroY - altura / 2;

    const graficos = this.add.graphics();

    graficos.fillStyle(0xffffff, 1);
    graficos.fillRoundedRect(x, y, largura, altura, raio);

    graficos.lineStyle(2, 0x333333, 1);
    graficos.strokeRoundedRect(x, y, largura, altura, raio);

    this.add
      .text(centroX, centroY, 'A\u2660', {
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#000000',
      })
      .setOrigin(0.5);
  }
}
