import { Game } from 'phaser';
import { JogoScene } from './adapters/phaser/scenes/JogoScene';
import { MenuScene } from './adapters/phaser/scenes/MenuScene';
import './style.css';

let jogo: Game | null = null;

export function inicializarJogo(containerId?: string): Game {
  jogo = new Game({
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: containerId,
    resolution: window.devicePixelRatio,
    antialias: false,
    roundPixels: true,
    scene: [MenuScene, JogoScene],
    scale: {
      mode: Phaser.Scale.RESIZE,
    },
  });
  return jogo;
}

if (typeof window !== 'undefined') {
  const jogo = inicializarJogo('app');

  if (import.meta.env.DEV) {
    (window as unknown as Record<string, unknown>).__jogoPhaser = jogo;
  }
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    jogo?.destroy(true);
    jogo = null;
  });
}
