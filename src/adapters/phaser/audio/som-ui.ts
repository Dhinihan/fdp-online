import type { Sound, Scene } from 'phaser';

const CHAVE_SOM_UI = 'som-ui-click';
const CAMINHO_SOM_UI = 'sfx/ui-click.mp3';
const VOLUME_SOM_UI = 0.35;
const sonsPorCena = new WeakMap<Scene, Sound.BaseSound>();
const cenasPreparadas = new WeakSet<Scene>();

export function precarregarSomUi(scene: Scene): void {
  if (scene.cache.audio.exists(CHAVE_SOM_UI)) {
    return;
  }

  scene.load.audio(CHAVE_SOM_UI, CAMINHO_SOM_UI);
}

export function prepararSomUi(scene: Scene): void {
  if (!scene.cache.audio.exists(CHAVE_SOM_UI) || sonsPorCena.has(scene)) {
    return;
  }

  const som = scene.sound.add(CHAVE_SOM_UI, { volume: VOLUME_SOM_UI });
  sonsPorCena.set(scene, som);

  if (cenasPreparadas.has(scene)) {
    return;
  }

  cenasPreparadas.add(scene);
  scene.events.once('shutdown', () => {
    sonsPorCena.get(scene)?.destroy();
    sonsPorCena.delete(scene);
    cenasPreparadas.delete(scene);
  });
}

export function tocarSomUi(scene: Scene): void {
  const som = sonsPorCena.get(scene);

  if (!som) {
    return;
  }

  som.stop();
  som.play();
}
