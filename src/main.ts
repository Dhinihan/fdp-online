import { Game } from 'phaser';
import { JogoScene } from './adapters/phaser/scenes/JogoScene';
import { MenuScene } from './adapters/phaser/scenes/MenuScene';
import './style.css';

let jogo: Game | null = null;
let aoRedimensionar: (() => void) | null = null;

function obterDpr(): number {
  return window.devicePixelRatio || 1;
}

function criarConfiguracaoJogo(containerId?: string): Phaser.Types.Core.GameConfig {
  const dpr = obterDpr();
  return {
    type: Phaser.AUTO,
    width: window.innerWidth * dpr,
    height: window.innerHeight * dpr,
    parent: containerId,
    zoom: 1 / dpr,
    scene: [MenuScene, JogoScene],
    scale: {
      mode: Phaser.Scale.NONE,
    },
  };
}

export function inicializarJogo(containerId?: string): Game {
  jogo = new Game(criarConfiguracaoJogo(containerId));

  aoRedimensionar = (): void => {
    if (!jogo) return;
    const dpr = obterDpr();
    jogo.scale.setZoom(1 / dpr);
    jogo.scale.resize(window.innerWidth * dpr, window.innerHeight * dpr);
  };

  window.addEventListener('resize', aoRedimensionar);

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
    if (aoRedimensionar) {
      window.removeEventListener('resize', aoRedimensionar);
      aoRedimensionar = null;
    }
    jogo?.destroy(true);
    jogo = null;
  });
}
