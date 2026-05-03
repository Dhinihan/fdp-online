import type { GameObjects, Scene } from 'phaser';
import type { Carta } from '@/core/Carta';

export const LARGURA = 50;
export const ALTURA = 75;
export const RAIO = 6;

export interface ConfigCartaFrente {
  cena: Scene;
  x: number;
  y: number;
  carta: Carta;
}

export function criarCartaFrente(config: ConfigCartaFrente): GameObjects.Container {
  const { cena, x, y, carta } = config;
  const frente = cena.add.graphics();
  const bordaPx = 1;
  const rx = -LARGURA / 2;
  const ry = -ALTURA / 2;

  frente.fillStyle(0x333333, 1);
  frente.fillRoundedRect(rx - bordaPx, ry - bordaPx, LARGURA + bordaPx * 2, ALTURA + bordaPx * 2, RAIO + bordaPx);
  frente.fillStyle(0xffffff, 1);
  frente.fillRoundedRect(rx, ry, LARGURA, ALTURA, RAIO);

  const texto = cena.add
    .text(0, 0, `${carta.valor}${carta.naipe}`, { fontSize: '14px', fontStyle: 'bold', color: '#000000' })
    .setOrigin(0.5);

  return cena.add.container(Math.round(x), Math.round(y), [frente, texto]).setSize(LARGURA, ALTURA);
}

export interface ConfigCartaVerso {
  cena: Scene;
  x: number;
  y: number;
}

export function criarCartaVerso(config: ConfigCartaVerso): GameObjects.Container {
  const { cena, x, y } = config;
  const verso = cena.add.graphics();
  const bordaPx = 1;
  const rx = -LARGURA / 2;
  const ry = -ALTURA / 2;

  verso.fillStyle(0xd9e8f5, 1);
  verso.fillRoundedRect(rx - bordaPx, ry - bordaPx, LARGURA + bordaPx * 2, ALTURA + bordaPx * 2, RAIO + bordaPx);
  verso.fillStyle(0x1f4e79, 1);
  verso.fillRoundedRect(rx, ry, LARGURA, ALTURA, RAIO);
  return cena.add.container(Math.round(x), Math.round(y), [verso]).setSize(LARGURA, ALTURA);
}
