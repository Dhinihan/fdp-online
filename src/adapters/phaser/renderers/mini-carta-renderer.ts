import type { GameObjects, Scene } from 'phaser';
import type { Carta } from '@/core/Carta';
import { escalar, escalarFonte } from '../escala';

export const LARGURA_MINI = 30;
export const ALTURA_MINI = 45;
export const RAIO_MINI = 4;

export interface ConfigMiniCarta {
  cena: Scene;
  x: number;
  y: number;
  carta: Carta;
}

export function criarMiniCarta(config: ConfigMiniCarta): GameObjects.Container {
  const { cena, x, y, carta } = config;
  const largura = escalar(LARGURA_MINI, cena);
  const altura = escalar(ALTURA_MINI, cena);
  const raio = escalar(RAIO_MINI, cena);
  const bordaPx = escalar(1, cena);

  const frente = cena.add.graphics();
  const rx = -largura / 2;
  const ry = -altura / 2;

  frente.fillStyle(0x333333, 1);
  frente.fillRoundedRect(rx - bordaPx, ry - bordaPx, largura + bordaPx * 2, altura + bordaPx * 2, raio + bordaPx);
  frente.fillStyle(0xffffff, 1);
  frente.fillRoundedRect(rx, ry, largura, altura, raio);

  const naipeCor = carta.naipe === '♥' || carta.naipe === '♦' ? '#cc0000' : '#000000';
  const texto = cena.add
    .text(0, 0, `${carta.valor}${carta.naipe}`, {
      fontSize: escalarFonte(9, cena),
      fontStyle: 'bold',
      color: naipeCor,
    })
    .setOrigin(0.5);

  return cena.add.container(Math.round(x), Math.round(y), [frente, texto]).setSize(largura, altura);
}
