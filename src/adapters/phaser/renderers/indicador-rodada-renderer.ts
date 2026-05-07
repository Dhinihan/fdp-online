import type { Scene } from 'phaser';
import type { Valor } from '@/core/Carta';
import { escalar, escalarFonte } from '../escala';
import { limparObjetos } from './limpar-objetos';

export interface ConfigIndicadorRodada {
  cena: Scene;
  numeroRodada: number;
  manilha: Valor;
  objetos: Phaser.GameObjects.GameObject[];
}

export function desenharIndicadorRodada(config: ConfigIndicadorRodada): void {
  const { cena, numeroRodada, manilha, objetos } = config;
  limparObjetos(objetos);
  const x = cena.cameras.main.width / 2;
  const y = escalar(24, cena);
  const texto = cena.add
    .text(x, y, `Rodada ${numeroRodada.toString()} · Manilha: ${manilha}`, {
      fontSize: escalarFonte(16, cena),
      color: '#ffffff',
      backgroundColor: '#00000099',
      padding: { x: escalar(10, cena), y: escalar(6, cena) },
    })
    .setOrigin(0.5, 0)
    .setDepth(120);
  objetos.push(texto);
}
