import type { Scene } from 'phaser';
import type { Carta } from '@/core/Carta';
import { criarCartaFrente } from './carta-renderer';

export interface ConfigRenderizarMesa {
  cena: Scene;
  mesa: Carta[];
  objetos: Phaser.GameObjects.GameObject[];
}

export function renderizarMesa(config: ConfigRenderizarMesa): void {
  const { cena, mesa, objetos } = config;
  const cx = cena.cameras.main.width / 2;
  const cy = cena.cameras.main.height / 2;
  mesa.forEach((carta, i) => {
    const x = cx + (i - mesa.length / 2 + 0.5) * 55;
    const y = cy;
    objetos.push(criarCartaFrente({ cena, x, y, carta }));
  });
}
