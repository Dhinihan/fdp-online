import type { Scene } from 'phaser';

export function obterDpr(cena: Scene): number {
  return 1 / cena.game.scale.zoom;
}

export function escalar(valor: number, cena: Scene): number {
  return Math.round(valor * obterDpr(cena));
}

export function escalarFonte(tamanhoPx: number, cena: Scene): string {
  return `${String(escalar(tamanhoPx, cena))}px`;
}
