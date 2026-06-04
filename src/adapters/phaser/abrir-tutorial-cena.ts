import type { Scene } from 'phaser';
import { abrirTutorial } from '../tutorial/tutorial-overlay';

// Liga o overlay (DOM, engine-agnóstico) ao ciclo de uma cena Phaser.
// Centraliza o par pause/resume num só lugar, de forma atômica: a cena
// só pausa se o overlay realmente abriu, e a retomada fica garantida no
// fechamento (✕, CTA, ESC ou clique fora). Ver docs/adr/0004.
export function abrirTutorialPausandoCena(cena: Scene): void {
  const abriu = abrirTutorial({
    aoFechar: () => {
      cena.scene.resume();
    },
  });
  if (abriu) cena.scene.pause();
}
