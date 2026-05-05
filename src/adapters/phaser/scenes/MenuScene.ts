import { Scene } from 'phaser';
import type { GameObjects } from 'phaser';
import { precarregarSomUi, prepararSomUi, tocarSomUi } from '../audio/som-ui';
import { escalar, escalarFonte } from '../escala';
import { criarDebounceResize, type ResizeDebouncer } from '../redimensionamento';

type Graphics = GameObjects.Graphics;
type Text = GameObjects.Text;
type Zone = GameObjects.Zone;

export class MenuScene extends Scene {
  private titulo?: Text;
  private botaoGrafico?: Graphics;
  private botaoTexto?: Text;
  private botaoZona?: Zone;
  private redesenhar?: ResizeDebouncer;

  constructor() {
    super({ key: 'MenuScene' });
  }

  preload(): void {
    precarregarSomUi(this);
  }

  create(): void {
    prepararSomUi(this);
    this.cameras.main.setBackgroundColor('#1a1a2e');
    this.desenharElementos();

    this.redesenhar = criarDebounceResize(this, () => {
      this.destruirElementos();
      this.desenharElementos();
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
        fontSize: escalarFonte(64, this),
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5);
  }

  private criarBotao(x: number, y: number): void {
    const larguraBotao = escalar(200, this);
    const alturaBotao = escalar(56, this);
    const raio = escalar(12, this);

    const posX = x - larguraBotao / 2;
    const posY = y - alturaBotao / 2;

    this.botaoGrafico = this.add.graphics();
    this.botaoGrafico.fillStyle(0x4ecca3, 1);
    this.botaoGrafico.fillRoundedRect(posX, posY, larguraBotao, alturaBotao, raio);

    this.botaoTexto = this.add
      .text(x, y, 'Jogar', {
        fontSize: escalarFonte(24, this),
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
    this.botaoZona?.disableInteractive();
    tocarSomUi(this);

    this.cameras.main.fadeOut(500);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('JogoScene');
    });
  };
}
