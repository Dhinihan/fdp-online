import type { GameObjects, Scene } from 'phaser';
import type { Carta } from '@/core/Carta';

const LARGURA = 50;
const ALTURA = 75;
const RAIO = 6;

export interface ConfigCartaFrente {
  cena: Scene;
  x: number;
  y: number;
  carta: Carta;
}

export function criarCartaFrente(config: ConfigCartaFrente): GameObjects.Container {
  const { cena, x, y, carta } = config;
  const frente = cena.add.graphics();
  frente.fillStyle(0xffffff, 1);
  frente.fillRoundedRect(-LARGURA / 2, -ALTURA / 2, LARGURA, ALTURA, RAIO);
  frente.lineStyle(1, 0x333333, 1);
  frente.strokeRoundedRect(-LARGURA / 2, -ALTURA / 2, LARGURA, ALTURA, RAIO);

  const texto = cena.add
    .text(0, 0, `${carta.valor}${carta.naipe}`, { fontSize: '14px', fontStyle: 'bold', color: '#000000' })
    .setOrigin(0.5);

  return cena.add.container(x, y, [frente, texto]).setSize(LARGURA, ALTURA);
}

export interface ConfigCartaVerso {
  cena: Scene;
  x: number;
  y: number;
}

export function criarCartaVerso(config: ConfigCartaVerso): GameObjects.Container {
  const { cena, x, y } = config;
  const verso = cena.add.graphics();
  verso.fillStyle(0x1f4e79, 1);
  verso.fillRoundedRect(-LARGURA / 2, -ALTURA / 2, LARGURA, ALTURA, RAIO);
  verso.lineStyle(1, 0xd9e8f5, 1);
  verso.strokeRoundedRect(-LARGURA / 2, -ALTURA / 2, LARGURA, ALTURA, RAIO);
  return cena.add.container(x, y, [verso]).setSize(LARGURA, ALTURA);
}
