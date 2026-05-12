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

  const cantoSuperior = criarIndiceCarta({ cena, carta, x: rx + escalar(9, cena), y: ry + escalar(13, cena) });
  const cantoInferior = criarIndiceCarta({
    cena,
    carta,
    x: rx + largura - escalar(9, cena),
    y: ry + altura - escalar(13, cena),
  });
  cantoInferior.setRotation(Math.PI);

  return cena.add
    .container(Math.round(x), Math.round(y), [frente, cantoSuperior, cantoInferior])
    .setSize(largura, altura);
}

interface ConfigIndiceCarta {
  cena: Scene;
  carta: Carta;
  x: number;
  y: number;
}

function criarIndiceCarta(config: ConfigIndiceCarta): GameObjects.Container {
  const { cena, carta, x, y } = config;
  const estilo = {
    fontSize: escalarFonte(14, cena),
    fontStyle: 'bold',
    color: obterCorNaipe(carta.naipe),
  };
  const valor = cena.add.text(0, -escalar(5, cena), carta.valor, estilo).setOrigin(0.5);
  const naipe = cena.add.text(0, escalar(6, cena), carta.naipe, estilo).setOrigin(0.5);
  return cena.add.container(x, y, [valor, naipe]);
}

function obterCorNaipe(naipe: Carta['naipe']): string {
  return naipe === '♥' || naipe === '♦' ? '#cc0000' : '#000000';
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
