import type { Scene } from 'phaser';
import type { Carta } from '@/core/Carta';
import { escalar } from '../escala';
import type { Retangulo } from '../layout';
import { criarCartaFrente } from './carta-renderer';

export interface ConfigRenderizarMesa {
  cena: Scene;
  mesa: Carta[];
  objetos: Phaser.GameObjects.GameObject[];
  gameArea: Retangulo;
}

export function renderizarMesa(config: ConfigRenderizarMesa): void {
  const { cena, mesa, objetos, gameArea } = config;
  const cx = gameArea.x + gameArea.largura / 2;
  const cy = gameArea.y + gameArea.altura / 2;
  const espacamento = escalar(55, cena);
  mesa.forEach((carta, i) => {
    const x = cx + (i - mesa.length / 2 + 0.5) * espacamento;
    const y = cy;
    objetos.push(criarCartaFrente({ cena, x, y, carta }));
  });
}
