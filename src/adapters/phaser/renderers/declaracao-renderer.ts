import type { Scene } from 'phaser';
import { escalar } from '../escala';
import type { Retangulo } from '../layout';

export interface ConfigDeclaracaoRenderer {
  cena: Scene;
  maximo: number;
  objetos: Phaser.GameObjects.GameObject[];
  gameArea: Retangulo;
  onSelecionar: (valor: number) => void;
}

export function desenharBotoesDeclaracao(config: ConfigDeclaracaoRenderer): void {
  const { cena, maximo, objetos, gameArea, onSelecionar } = config;
  const centroX = gameArea.x + gameArea.largura / 2;
  const centroY = gameArea.y + gameArea.altura / 2;
  const titulo = cena.add
    .text(centroX, centroY - escalar(30, cena), 'Declare quantas vai fazer:', {
      fontSize: `${String(escalar(20, cena))}px`,
      color: '#ffffff',
      fontFamily: 'Arial',
    })
    .setOrigin(0.5);
  objetos.push(titulo);
  for (let i = 0; i <= maximo; i++) {
    const botao = cena.add
      .text(centroX + (i - maximo / 2) * escalar(40, cena), centroY + escalar(10, cena), String(i), {
        fontSize: `${String(escalar(24, cena))}px`,
        color: '#f1c40f',
        fontFamily: 'Arial',
        backgroundColor: '#2c3e50',
        padding: { x: escalar(8, cena), y: escalar(4, cena) },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        onSelecionar(i);
      });
    objetos.push(botao);
  }
}

export function limparObjetosDeclaracao(objetos: Phaser.GameObjects.GameObject[]): void {
  objetos.forEach((obj) => {
    obj.destroy();
  });
  objetos.length = 0;
}
