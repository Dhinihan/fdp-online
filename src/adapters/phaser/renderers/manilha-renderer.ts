import type { Scene } from 'phaser';
import type { Carta, Valor } from '@/core/Carta';
import { escalar, escalarFonte } from '../escala';
import { criarCartaFrente } from './carta-renderer';

export interface ConfigManilha {
  cena: Scene;
  cartaVirada: Carta;
  manilha: Valor;
  objetos: Phaser.GameObjects.GameObject[];
}

export function limparManilha(objetos: Phaser.GameObjects.GameObject[]): void {
  objetos.forEach((o) => {
    o.destroy();
  });
  objetos.length = 0;
}

export function desenharManilha(config: ConfigManilha): void {
  const { cena, cartaVirada, manilha, objetos } = config;
  const cx = cena.cameras.main.width / 2;
  const cy = cena.cameras.main.height / 2;
  const cartaY = cy - escalar(90, cena);

  const cartaObj = criarCartaFrente({
    cena,
    x: cx,
    y: cartaY,
    carta: cartaVirada,
  });
  objetos.push(cartaObj);

  const texto = cena.add
    .text(cx, cartaY + escalar(55, cena), `Manilha: ${manilha}`, {
      fontSize: escalarFonte(12, cena),
      color: '#ffffff',
    })
    .setOrigin(0.5);
  objetos.push(texto);
}
