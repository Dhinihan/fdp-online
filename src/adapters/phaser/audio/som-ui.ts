import type { Scene } from 'phaser';

const CHAVE_SOM_UI = 'som-ui-click';
const CAMINHO_SOM_UI = 'sfx/ui-click.mp3';
const VOLUME_SOM_UI = 0.35;

export function precarregarSomUi(scene: Scene): void {
  if (scene.cache.audio.exists(CHAVE_SOM_UI)) {
    return;
  }

  scene.load.audio(CHAVE_SOM_UI, CAMINHO_SOM_UI);
}

export function tocarSomUi(scene: Scene): void {
  if (!scene.cache.audio.exists(CHAVE_SOM_UI)) {
    return;
  }

  const tocar = (): void => {
    scene.sound.stopByKey(CHAVE_SOM_UI);
    scene.sound.play(CHAVE_SOM_UI, { volume: VOLUME_SOM_UI });
  };

  if (!scene.sound.locked) {
    tocar();
    return;
  }

  const contexto = 'context' in scene.sound ? scene.sound.context : undefined;

  if (!contexto || contexto.state !== 'suspended') {
    tocar();
    return;
  }

  void contexto.resume().then(tocar).catch(tocar);
}
