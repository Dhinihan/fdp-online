import type { Scene } from 'phaser';
import { escalar, escalarFonte } from '../escala';

export interface ConfigIndicadorVez {
  cena: Scene;
  labels: Phaser.GameObjects.Text[];
  jogadorAtual: number;
  tweenAtual?: Phaser.Tweens.Tween;
}

export function atualizarIndicadorVez(config: ConfigIndicadorVez): Phaser.Tweens.Tween {
  const { cena, labels, jogadorAtual, tweenAtual } = config;
  labels.forEach((label, i) => {
    label.setColor(i === jogadorAtual ? '#ffff00' : '#ffffff');
  });
  if (tweenAtual) {
    tweenAtual.stop();
    tweenAtual.remove();
  }
  return cena.tweens.add({
    targets: labels[jogadorAtual],
    scale: { from: 1, to: 1.2 },
    duration: 500,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });
}

export interface ConfigAnimarTurno {
  cena: Scene;
  labels: Phaser.GameObjects.Text[];
  jogadores: { id: string }[];
  vencedorId?: string;
  mesaObjetos: Phaser.GameObjects.GameObject[];
}

export function animarRecolhimentoTurno(config: ConfigAnimarTurno): void {
  const { cena, labels, jogadores, vencedorId, mesaObjetos } = config;
  if (vencedorId) {
    const indice = jogadores.findIndex((j) => j.id === vencedorId);
    if (indice >= 0) {
      const label = labels[indice];
      cena.tweens.add({
        targets: label,
        scale: 1.4,
        duration: 300,
        yoyo: true,
        ease: 'Sine.easeInOut',
      });
    }
  }
  mesaObjetos.forEach((obj) => {
    cena.tweens.add({
      targets: obj,
      alpha: 0,
      duration: 400,
      onComplete: () => {
        obj.destroy();
      },
    });
  });
}

export function mostrarOverlayRodadaConcluida(cena: Scene, objetos: Phaser.GameObjects.GameObject[]): void {
  const cx = cena.cameras.main.width / 2;
  const cy = cena.cameras.main.height / 2;
  const largura = escalar(320, cena);
  const altura = escalar(80, cena);
  const fundo = cena.add.rectangle(cx, cy, largura, altura, 0x000000, 0.7).setDepth(200);
  const texto = cena.add
    .text(cx, cy, 'Rodada concluída', { fontSize: escalarFonte(24, cena), color: '#ffffff' })
    .setOrigin(0.5)
    .setDepth(201);
  objetos.push(fundo, texto);
}
