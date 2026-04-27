import { Game } from 'phaser';
import { JogoScene } from './adapters/phaser/scenes/JogoScene';

let jogo: Game | null = null;

export function inicializarJogo(containerId?: string): Game {
  jogo = new Game({
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: containerId,
    scene: JogoScene,
    scale: {
      mode: Phaser.Scale.RESIZE,
    },
  });
  return jogo;
}

if (typeof window !== 'undefined') {
  inicializarJogo('app');
}
