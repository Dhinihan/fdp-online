import { Geom, Math as MatematicaPhaser, Scene } from 'phaser';
import type { GameObjects } from 'phaser';
import { emissorEventos } from '@/store/emissor-eventos';
import { criarDebounceResize, type ResizeDebouncer } from '../redimensionamento';

type Container = GameObjects.Container;
type Graphics = GameObjects.Graphics;
type Text = GameObjects.Text;

const CARTA_ID = 'placeholder-carta';
const DURACAO_FLIP_MS = 280;
const LARGURA_CARTA = 80;
const ALTURA_CARTA = 120;
const RAIO_CARTA = 8;

function contemPontoNaArea(area: Geom.Rectangle, x: number, y: number): boolean {
  return area.contains(x, y);
}

export class JogoScene extends Scene {
  private carta?: Container;
  private frenteDaCarta?: Graphics;
  private versoDaCarta?: Graphics;
  private textoDaCarta?: Text;
  private redesenhar?: ResizeDebouncer;
  private animandoVirada = false;
  private cartaVirada = false;

  constructor() {
    super({ key: 'JogoScene' });
  }

  create(): void {
    this.criarCartaPlaceholder();

    this.redesenhar = criarDebounceResize(this, () => {
      this.carta?.destroy();
      this.criarCartaPlaceholder();
    });

    this.scale.on('resize', this.redesenhar);
    this.game.canvas.addEventListener('click', this.aoClicarNoCanvas);
    this.events.on('shutdown', () => {
      this.shutdown();
    });
  }

  shutdown(): void {
    if (this.redesenhar) {
      this.scale.off('resize', this.redesenhar);
      this.redesenhar.limpar();
    }
    this.game.canvas.removeEventListener('click', this.aoClicarNoCanvas);
  }

  private criarCartaPlaceholder(): void {
    const centroX = this.cameras.main.centerX;
    const centroY = this.cameras.main.centerY;

    this.frenteDaCarta = this.criarFaceCarta(0xffffff, 0x333333);
    this.versoDaCarta = this.criarFaceCarta(0x1f4e79, 0xd9e8f5);
    this.versoDaCarta.setVisible(false);
    this.textoDaCarta = this.add
      .text(0, 0, 'A\u2660', {
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#000000',
      })
      .setOrigin(0.5);

    this.carta = this.criarContainerCarta(centroX, centroY);

    this.atualizarFaces();
  }

  private criarContainerCarta(centroX: number, centroY: number): Container {
    const areaInterativa = new Geom.Rectangle(-LARGURA_CARTA / 2, -ALTURA_CARTA / 2, LARGURA_CARTA, ALTURA_CARTA);
    const frenteDaCarta = this.frenteDaCarta;
    const versoDaCarta = this.versoDaCarta;
    const textoDaCarta = this.textoDaCarta;

    if (!frenteDaCarta || !versoDaCarta || !textoDaCarta) {
      throw new Error('Carta placeholder incompleta.');
    }

    return this.add
      .container(centroX, centroY, [frenteDaCarta, versoDaCarta, textoDaCarta])
      .setSize(LARGURA_CARTA, ALTURA_CARTA)
      .setInteractive(areaInterativa, contemPontoNaArea)
      .on('pointerdown', this.aoInteragirComCarta);
  }

  private criarFaceCarta(corFundo: number, corBorda: number): Graphics {
    const face = this.add.graphics();
    face.fillStyle(corFundo, 1);
    face.fillRoundedRect(-LARGURA_CARTA / 2, -ALTURA_CARTA / 2, LARGURA_CARTA, ALTURA_CARTA, RAIO_CARTA);
    face.lineStyle(2, corBorda, 1);
    face.strokeRoundedRect(-LARGURA_CARTA / 2, -ALTURA_CARTA / 2, LARGURA_CARTA, ALTURA_CARTA, RAIO_CARTA);
    return face;
  }

  private aoInteragirComCarta = (): void => {
    if (this.animandoVirada || this.cartaVirada || !this.carta) return;

    this.emitirEventosVirada();
    this.animandoVirada = true;
    this.animarVirada();
  };

  private emitirEventosVirada(): void {
    if (!this.carta) return;

    const posicao = { x: this.carta.x, y: this.carta.y };
    const timestamp = Date.now();
    emissorEventos.emit({ id: crypto.randomUUID(), timestamp, tipo: 'TOQUE_CARTA', cartaId: CARTA_ID, posicao });
    emissorEventos.emit({
      id: crypto.randomUUID(),
      timestamp,
      tipo: 'EFEITO_CARTA_VIRADA',
      elementoId: CARTA_ID,
      duracaoMs: DURACAO_FLIP_MS,
    });
  }

  private animarVirada(): void {
    this.tweens.add({
      targets: this.carta,
      scaleX: 0,
      duration: DURACAO_FLIP_MS / 2,
      onComplete: this.concluirPrimeiraMetadeVirada,
    });
  }

  private concluirPrimeiraMetadeVirada = (): void => {
    this.cartaVirada = true;
    this.atualizarFaces();
    this.tweens.add({
      targets: this.carta,
      scaleX: 1,
      duration: DURACAO_FLIP_MS / 2,
      onComplete: this.finalizarAnimacaoVirada,
    });
  };

  private finalizarAnimacaoVirada = (): void => {
    this.animandoVirada = false;
  };

  private atualizarFaces(): void {
    this.frenteDaCarta?.setVisible(!this.cartaVirada);
    this.textoDaCarta?.setVisible(!this.cartaVirada);
    this.versoDaCarta?.setVisible(this.cartaVirada);
  }

  private aoClicarNoCanvas = (evento: MouseEvent): void => {
    if (this.animandoVirada || this.cartaVirada || !this.carta) return;

    const area = this.game.canvas.getBoundingClientRect();
    const escalaX = this.game.canvas.width / area.width;
    const escalaY = this.game.canvas.height / area.height;
    const ponto = new MatematicaPhaser.Vector2(
      (evento.clientX - area.left) * escalaX,
      (evento.clientY - area.top) * escalaY,
    );

    if (this.carta.getBounds().contains(ponto.x, ponto.y)) {
      this.aoInteragirComCarta();
    }
  };
}
