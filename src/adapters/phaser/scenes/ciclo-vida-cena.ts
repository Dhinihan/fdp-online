import type { ResizeDebouncer } from '../redimensionamento';
import { destruirDestaque, type EstadoDestaque } from '../renderers/destaque-renderer';
import { limparObjetos } from '../renderers/limpar-objetos';
import { limparManilha } from '../renderers/manilha-renderer';
import { limparPlacar } from '../renderers/placar-renderer';
import { mostrarOverlayRodadaConcluida } from '../renderers/turno-renderer';

interface ConfigEncerramento {
  cena: Phaser.Scene;
  redesenhar?: ResizeDebouncer;
  tweenVez?: Phaser.Tweens.Tween;
  objetos: Phaser.GameObjects.GameObject[];
  mesaObjetos: Phaser.GameObjects.GameObject[];
  indicadorRodadaObjetos: Phaser.GameObjects.GameObject[];
  manilhaObjetos: Phaser.GameObjects.GameObject[];
  placarObjetos: Phaser.GameObjects.GameObject[];
  destaque: EstadoDestaque;
}

export function aoEncerrarCena(config: ConfigEncerramento): {
  redesenhar?: ResizeDebouncer;
  tweenVez?: Phaser.Tweens.Tween;
} {
  if (config.redesenhar) {
    config.cena.scale.off('resize', config.redesenhar);
    config.redesenhar.limpar();
  }
  config.tweenVez?.stop();
  config.tweenVez?.remove();
  limparObjetos(config.objetos);
  limparObjetos(config.mesaObjetos);
  limparObjetos(config.indicadorRodadaObjetos);
  limparManilha(config.manilhaObjetos);
  limparPlacar(config.placarObjetos);
  destruirDestaque(config.destaque);
  return { redesenhar: undefined, tweenVez: undefined };
}

export function transicionarRodada(
  cena: Phaser.Scene,
  objetos: Phaser.GameObjects.GameObject[],
  callback: () => void,
): void {
  mostrarOverlayRodadaConcluida(cena, objetos);
  cena.time.delayedCall(900, callback);
}
