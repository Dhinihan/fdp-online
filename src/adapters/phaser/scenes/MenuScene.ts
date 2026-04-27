import { Scene } from 'phaser';
import type { GameObjects } from 'phaser';

type Graphics = GameObjects.Graphics;
type Text = GameObjects.Text;
type Zone = GameObjects.Zone;

export class MenuScene extends Scene {
  private titulo?: Text;
  private botaoGrafico?: Graphics;
  private botaoTexto?: Text;
  private botaoZona?: Zone;
  private timeoutResize?: ReturnType<typeof setTimeout>;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#1a1a2e');
    this.desenharElementos();
    this.scale.on('resize', this.redesenhar);
  }

  shutdown(): void {
    this.scale.off('resize', this.redesenhar);
    if (this.timeoutResize) {
      clearTimeout(this.timeoutResize);
    }
  }

  private redesenhar = (): void => {
    if (this.timeoutResize) {
      clearTimeout(this.timeoutResize);
    }

    this.timeoutResize = setTimeout(() => {
      const largura = this.scale.width;
      const altura = this.scale.height;

      if (largura <= 0 || altura <= 0) {
        return;
      }

      this.destruirElementos();
      this.desenharElementos();
    }, 100);
  };

  private destruirElementos(): void {
    this.titulo?.destroy();
    this.botaoGrafico?.destroy();
    this.botaoTexto?.destroy();
    this.botaoZona?.destroy();
  }

  private desenharElementos(): void {
    const centroX = this.cameras.main.centerX;
    const altura = this.cameras.main.height;

    this.criarTitulo(centroX, altura * 0.3);
    this.criarBotao(centroX, altura * 0.6);
  }

  private criarTitulo(x: number, y: number): void {
    this.titulo = this.add
      .text(x, y, 'FDP', {
        fontSize: '64px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5);
  }

  private criarBotao(x: number, y: number): void {
    const larguraBotao = 200;
    const alturaBotao = 56;
    const raio = 12;

    const posX = x - larguraBotao / 2;
    const posY = y - alturaBotao / 2;

    this.botaoGrafico = this.add.graphics();
    this.botaoGrafico.fillStyle(0x4ecca3, 1);
    this.botaoGrafico.fillRoundedRect(posX, posY, larguraBotao, alturaBotao, raio);

    this.botaoTexto = this.add
      .text(x, y, 'Jogar', {
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.botaoZona = this.add.zone(x, y, larguraBotao, alturaBotao).setInteractive({
      useHandCursor: true,
    });

    this.botaoZona.on('pointerdown', this.iniciarJogo);
  }

  private iniciarJogo = (): void => {
    this.cameras.main.fadeOut(500);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('JogoScene');
    });
  };
}
