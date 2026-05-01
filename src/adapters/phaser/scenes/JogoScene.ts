import { Geom, Scene } from 'phaser';
import type { GameObjects, Tweens } from 'phaser';
import { emissorEventos } from '@/store/emissor-eventos';
import { criarDebounceResize, type ResizeDebouncer } from '../redimensionamento';

type Container = GameObjects.Container;
type Graphics = GameObjects.Graphics;
type Text = GameObjects.Text;
type Tween = Tweens.Tween;

const CARTA_ID = 'placeholder-carta';
const DURACAO_FLIP_MS = 280;
const LARGURA_CARTA = 80;
const ALTURA_CARTA = 120;
const RAIO_CARTA = 8;
const MARGEM_TOQUE_CARTA = 12;

function contemPontoNaArea(area: Geom.Rectangle, x: number, y: number): boolean {
  return area.contains(x, y);
}

export class JogoScene extends Scene {
  private carta?: Container;
  private frenteDaCarta?: Graphics;
  private versoDaCarta?: Graphics;
  private textoDaCarta?: Text;
  private redesenhar?: ResizeDebouncer;
  private tweenVirada?: Tween;
  private animandoVirada = false;
  private mostrandoVerso = false;
  private proximoEstadoVerso = false;

  constructor() {
    super({ key: 'JogoScene' });
  }

  create(): void {
    this.criarCartaPlaceholder();

    this.redesenhar = criarDebounceResize(this, this.recriarCartaPlaceholder);

    this.scale.on('resize', this.redesenhar);
    this.events.on('shutdown', () => {
      this.shutdown();
    });
  }

  shutdown(): void {
    this.limparAnimacaoVirada();

    if (this.redesenhar) {
      this.scale.off('resize', this.redesenhar);
      this.redesenhar.limpar();
      this.redesenhar = undefined;
    }

    this.mostrandoVerso = false;
    this.proximoEstadoVerso = false;
    this.carta = undefined;
    this.frenteDaCarta = undefined;
    this.versoDaCarta = undefined;
    this.textoDaCarta = undefined;
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

  private recriarCartaPlaceholder = (): void => {
    this.limparAnimacaoVirada();
    this.carta?.destroy();
    this.criarCartaPlaceholder();
  };

  private criarContainerCarta(centroX: number, centroY: number): Container {
    const areaInterativa = new Geom.Rectangle(
      -LARGURA_CARTA / 2 - MARGEM_TOQUE_CARTA,
      -ALTURA_CARTA / 2 - MARGEM_TOQUE_CARTA,
      LARGURA_CARTA + MARGEM_TOQUE_CARTA * 2,
      ALTURA_CARTA + MARGEM_TOQUE_CARTA * 2,
    );
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
    if (this.animandoVirada || !this.carta) return;

    this.virarCarta();
  };

  private virarCarta(): void {
    this.emitirEventosVirada();
    this.animandoVirada = true;
    this.proximoEstadoVerso = !this.mostrandoVerso;
    this.tweenVirada = this.tweens.add({
      targets: this.carta,
      scaleX: 0,
      duration: DURACAO_FLIP_MS / 2,
      onComplete: this.concluirVirada,
    });
  }

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

  private concluirVirada = (): void => {
    this.mostrandoVerso = this.proximoEstadoVerso;
    this.atualizarFaces();

    this.tweenVirada = this.tweens.add({
      targets: this.carta,
      scaleX: 1,
      duration: DURACAO_FLIP_MS / 2,
      onComplete: this.finalizarAnimacaoVirada,
    });
  };

  private finalizarAnimacaoVirada = (): void => {
    this.tweenVirada = undefined;
    this.animandoVirada = false;
  };

  private limparAnimacaoVirada(): void {
    this.tweenVirada?.remove();
    this.tweenVirada = undefined;
    this.animandoVirada = false;
    this.proximoEstadoVerso = this.mostrandoVerso;
  }

  private atualizarFaces(): void {
    this.frenteDaCarta?.setVisible(!this.mostrandoVerso);
    this.textoDaCarta?.setVisible(!this.mostrandoVerso);
    this.versoDaCarta?.setVisible(this.mostrandoVerso);
  }
}
