import type { Scene } from 'phaser';
import { abrirFeedback, type ContextoFeedback } from '../feedback/feedback-overlay';

export function abrirFeedbackPausandoCena(cena: Scene, contexto: ContextoFeedback): void {
  const abriu = abrirFeedback({
    contexto,
    aoFechar: () => {
      cena.scene.manager.resume(cena.scene.key);
    },
  });
  if (abriu) cena.scene.manager.pause(cena.scene.key);
}
