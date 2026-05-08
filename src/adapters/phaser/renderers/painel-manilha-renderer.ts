import type { Scene } from 'phaser';
import type { Carta, Valor } from '@/core/Carta';
import { escalar, escalarFonte } from '../escala';
import { criarMiniCarta } from './mini-carta-renderer';

interface Area {
  x: number;
  y: number;
  largura: number;
  altura: number;
}

interface ConfigManilha {
  cena: Scene;
  objetos: Phaser.GameObjects.GameObject[];
  cartaVirada: Carta;
  manilha: Valor;
  areaManilha: Area;
  ehPaisagem: boolean;
}

export function desenharManilhaNoPainel(config: ConfigManilha): void {
  const { cena, objetos, cartaVirada, manilha, areaManilha, ehPaisagem } = config;
  const posicao = calcularPosicaoManilha(cena, areaManilha, ehPaisagem);
  const miniCarta = criarMiniCarta({ cena, x: posicao.x, y: posicao.y, carta: cartaVirada });
  miniCarta.setDepth(81);
  objetos.push(miniCarta);
  const label = criarLabelManilha({ cena, manilha, posicao });
  objetos.push(label);
}

function calcularPosicaoManilha(cena: Scene, area: Area, ehPaisagem: boolean): { x: number; y: number } {
  if (ehPaisagem) {
    return { x: area.x + area.largura / 2, y: area.y + area.altura - escalar(70, cena) };
  }
  return { x: area.x + area.largura / 2, y: area.y + area.altura / 2 };
}

interface ConfigLabel {
  cena: Scene;
  manilha: Valor;
  posicao: { x: number; y: number };
}

function criarLabelManilha(config: ConfigLabel): Phaser.GameObjects.Text {
  const { cena, manilha, posicao } = config;
  return cena.add
    .text(posicao.x, posicao.y + escalar(32, cena), `Manilha: ${manilha}`, {
      fontSize: escalarFonte(9, cena),
      color: '#facc15',
      fontFamily: 'Arial',
    })
    .setOrigin(0.5, 0.5)
    .setDepth(81);
}

export type { Area };
