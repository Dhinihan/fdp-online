import type { ResizeDebouncer } from '../redimensionamento';
import { destruirDestaque, type EstadoDestaque } from '../renderers/destaque-renderer';
import { limparObjetos } from '../renderers/limpar-objetos';
import { mostrarOverlayRodadaConcluida } from '../renderers/turno-renderer';

interface ConfigEncerramento {
  cena: Phaser.Scene;
  redesenhar?: ResizeDebouncer;
  tweenVez?: Phaser.Tweens.Tween;
  objetos: Phaser.GameObjects.GameObject[];
  mesaObjetos: Phaser.GameObjects.GameObject[];
  painelObjetos: Phaser.GameObjects.GameObject[];
  fimJogoObjetos: Phaser.GameObjects.GameObject[];
  destaque: EstadoDestaque;
}

export function aoEncerrarCena(config: ConfigEncerramento): {
  redesenhar?: ResizeDebouncer;
  tweenVez?: Phaser.Tweens.Tween;
} {
  desativarResize(config.cena, config.redesenhar);
  config.tweenVez?.stop();
  config.tweenVez?.remove();
  limparObjetos(config.objetos);
  limparObjetos(config.mesaObjetos);
  limparObjetos(config.painelObjetos);
  limparObjetos(config.fimJogoObjetos);
  destruirDestaque(config.destaque);
  return { redesenhar: undefined, tweenVez: undefined };
}

export function desativarResize(cena: Phaser.Scene, redesenhar?: ResizeDebouncer): void {
  if (!redesenhar) return;
  cena.scale.off('resize', redesenhar);
  redesenhar.limpar();
}

export function transicionarRodada(
  cena: Phaser.Scene,
  objetos: Phaser.GameObjects.GameObject[],
  callback: () => void,
): void {
  mostrarOverlayRodadaConcluida(cena, objetos);
  cena.time.delayedCall(900, callback);
}
