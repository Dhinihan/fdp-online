import { Game } from 'phaser';
import { JogoScene } from './adapters/phaser/scenes/JogoScene';
import { MenuScene } from './adapters/phaser/scenes/MenuScene';
import { RankingScene } from './adapters/phaser/scenes/RankingScene';
import './style.css';

let jogo: Game | null = null;
let aoRedimensionar: (() => void) | null = null;

function obterDpr(): number {
  return window.devicePixelRatio || 1;
}

function obterModoDebug(): boolean {
  const debug = new URLSearchParams(window.location.search).get('debug');
  return debug === 'true' || debug === '1';
}

function criarConfiguracaoJogo(containerId?: string): Phaser.Types.Core.GameConfig {
  const dpr = obterDpr();
  return {
    type: Phaser.AUTO,
    width: window.innerWidth * dpr,
    height: window.innerHeight * dpr,
    parent: containerId,
    zoom: 1 / dpr,
    scene: [MenuScene, JogoScene, RankingScene],
    scale: {
      mode: Phaser.Scale.NONE,
    },
  };
}

function sincronizarTamanhoCanvas(jogo: Game): void {
  const dpr = obterDpr();
  jogo.scale.setZoom(1 / dpr);
  jogo.scale.resize(window.innerWidth * dpr, window.innerHeight * dpr);
  jogo.canvas.style.width = `${String(window.innerWidth)}px`;
  jogo.canvas.style.height = `${String(window.innerHeight)}px`;
}

export function inicializarJogo(containerId?: string): Game {
  jogo = new Game(criarConfiguracaoJogo(containerId));
  jogo.registry.set('modoDebug', obterModoDebug());
  sincronizarTamanhoCanvas(jogo);

  aoRedimensionar = (): void => {
    if (!jogo) return;
    sincronizarTamanhoCanvas(jogo);
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
