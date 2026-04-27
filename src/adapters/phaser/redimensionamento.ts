import type { Scene } from 'phaser';

export type ResizeDebouncer = (() => void) & { limpar: () => void };

export function criarDebounceResize(scene: Scene, callback: () => void, delay = 100): ResizeDebouncer {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const handler = (): void => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      if (scene.scale.width <= 0 || scene.scale.height <= 0) {
        return;
      }
      callback();
    }, delay);
  };

  handler.limpar = (): void => {
    if (timeout) {
      clearTimeout(timeout);
    }
  };

  return handler;
}
