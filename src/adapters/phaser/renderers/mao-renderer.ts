import type { GameObjects, Scene } from 'phaser';
import type { Carta } from '@/core/Carta';
import { escalarFonte } from '../escala';
import { criarCartaFrente, criarCartaVerso } from './carta-renderer';

export interface PosicaoMao {
  x: number;
  y: number;
  espacamento: number;
  direcao: 'horizontal' | 'vertical';
}

export interface ConfigRenderizarMao {
  cena: Scene;
  posicao: PosicaoMao;
  cartas: Carta[];
  visivel: boolean;
}

export function renderizarMao(config: ConfigRenderizarMao): GameObjects.GameObject[] {
  const { cena, posicao, cartas, visivel } = config;
  const objetos: GameObjects.GameObject[] = [];
  cartas.forEach((carta, i) => {
    const deslocamento = i * posicao.espacamento;
    const x = posicao.direcao === 'horizontal' ? posicao.x + deslocamento : posicao.x;
    const y = posicao.direcao === 'horizontal' ? posicao.y : posicao.y + deslocamento;
    const objeto = visivel ? criarCartaFrente({ cena, x, y, carta }) : criarCartaVerso({ cena, x, y });
    objeto.setDepth(i + 1);
    objetos.push(objeto);
  });
  return objetos;
}

export interface ConfigLabel {
  cena: Scene;
  x: number;
  y: number;
  texto: string;
}

export function renderizarLabel(config: ConfigLabel): GameObjects.Text {
  const { cena, x, y, texto } = config;
  return cena.add
    .text(x, y, texto, { fontSize: escalarFonte(16, cena), fontStyle: 'bold', color: '#ffffff' })
    .setOrigin(0.5);
}
