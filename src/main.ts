import type { Game, Scene } from 'phaser';

export async function criarCenaVazia(): Promise<new () => Scene> {
  const phaser = await import('phaser');
  class CenaVazia extends phaser.Scene {
    constructor() {
      super({ key: 'CenaVazia' });
    }
  }
  return CenaVazia;
}

export async function inicializarJogo(containerId?: string): Promise<Game> {
  const phaser = await import('phaser');
  const Cena = await criarCenaVazia();
  return new phaser.Game({
    width: 800,
    height: 600,
    scene: Cena,
    parent: containerId,
  });
}

if (typeof window !== 'undefined') {
  void inicializarJogo('app');
}
