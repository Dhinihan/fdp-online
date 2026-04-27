import type { Game, Scene } from 'phaser';

export async function inicializarJogo(containerId?: string): Promise<Game> {
  const phaser = await import('phaser');
  const { JogoScene } = await import('@/adapters/phaser/scenes/JogoScene');

  return new phaser.Game({
    type: phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: containerId,
    scene: JogoScene as unknown as new () => Scene,
    scale: {
      mode: phaser.Scale.RESIZE,
    },
  });
}

if (typeof window !== 'undefined') {
  void inicializarJogo('app');
}
