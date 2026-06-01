import type { Scene } from 'phaser';
import type { Carta, Valor } from '@/core/Carta';
import { escalar, escalarFonte } from '../escala';
import type { Retangulo } from '../layout';
import { calcularLayoutManilha, type LayoutManilha } from '../layout-manilha';
import { ALTURA, criarCartaFrente, LARGURA } from './carta-renderer';

export const MARGEM_BASE = 8;
export const GAP_CARTA_LABEL_BASE = 4;
export const ALTURA_LABEL_BASE = 14;

interface ConfigManilha {
  cena: Scene;
  objetos: Phaser.GameObjects.GameObject[];
  cartaVirada: Carta;
  manilha: Valor;
  areaManilha: Retangulo;
  ehPaisagem: boolean;
}

export function desenharManilhaNoPainel(config: ConfigManilha): void {
  const { cena, objetos, cartaVirada, manilha, areaManilha, ehPaisagem } = config;
  const layout = calcularLayoutManilha({
    area: areaManilha,
    cartaLargura: escalar(LARGURA, cena),
    cartaAltura: escalar(ALTURA, cena),
    margem: escalar(MARGEM_BASE, cena),
    gapCartaLabel: escalar(GAP_CARTA_LABEL_BASE, cena),
    alturaLabel: escalar(ALTURA_LABEL_BASE, cena),
    ehPaisagem,
  });
  const carta = criarCartaFrente({ cena, x: layout.cartaX, y: layout.cartaY, carta: cartaVirada });
  carta.setScale(layout.escala).setDepth(81);
  objetos.push(carta);
  const label = criarLabelManilha({ cena, manilha, layout });
  objetos.push(label);
}

interface ConfigLabel {
  cena: Scene;
  manilha: Valor;
  layout: LayoutManilha;
}

function criarLabelManilha(config: ConfigLabel): Phaser.GameObjects.Text {
  const { cena, manilha, layout } = config;
  return cena.add
    .text(layout.labelX, layout.labelY, `Manilha: ${manilha}`, {
      fontSize: escalarFonte(9, cena),
      color: '#facc15',
      fontFamily: 'Arial',
    })
    .setOrigin(0.5, 0.5)
    .setDepth(81);
}
