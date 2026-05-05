import type { GameObjects, Scene } from 'phaser';
import type { Carta } from '@/core/Carta';
import { escalar, escalarFonte } from '../escala';

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
  const largura = escalar(LARGURA, cena);
  const altura = escalar(ALTURA, cena);
  const raio = escalar(RAIO, cena);
  const bordaPx = escalar(1, cena);
  const frente = cena.add.graphics();
  const rx = -largura / 2;
  const ry = -altura / 2;

  frente.fillStyle(0x333333, 1);
  frente.fillRoundedRect(rx - bordaPx, ry - bordaPx, largura + bordaPx * 2, altura + bordaPx * 2, raio + bordaPx);
  frente.fillStyle(0xffffff, 1);
  frente.fillRoundedRect(rx, ry, largura, altura, raio);

  const texto = cena.add
    .text(0, 0, `${carta.valor}${carta.naipe}`, {
      fontSize: escalarFonte(14, cena),
      fontStyle: 'bold',
      color: '#000000',
    })
    .setOrigin(0.5);

  return cena.add.container(Math.round(x), Math.round(y), [frente, texto]).setSize(largura, altura);
}

export interface ConfigCartaVerso {
  cena: Scene;
  x: number;
  y: number;
}

export function criarCartaVerso(config: ConfigCartaVerso): GameObjects.Container {
  const { cena, x, y } = config;
  const largura = escalar(LARGURA, cena);
  const altura = escalar(ALTURA, cena);
  const raio = escalar(RAIO, cena);
  const bordaPx = escalar(1, cena);
  const verso = cena.add.graphics();
  const rx = -largura / 2;
  const ry = -altura / 2;

  verso.fillStyle(0xd9e8f5, 1);
  verso.fillRoundedRect(rx - bordaPx, ry - bordaPx, largura + bordaPx * 2, altura + bordaPx * 2, raio + bordaPx);
  verso.fillStyle(0x1f4e79, 1);
  verso.fillRoundedRect(rx, ry, largura, altura, raio);
  return cena.add.container(Math.round(x), Math.round(y), [verso]).setSize(largura, altura);
}
