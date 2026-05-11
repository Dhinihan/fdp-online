import type { Scene } from 'phaser';
import { escalar } from '../escala';
import type { Retangulo } from '../layout';

export interface ConfigDeclaracaoRenderer {
  cena: Scene;
  maximo: number;
  objetos: Phaser.GameObjects.GameObject[];
  gameArea: Retangulo;
  onSelecionar: (valor: number) => void;
  valorInicial?: number;
  onAlterar?: (valor: number) => void;
}

interface Posicao {
  x: number;
  y: number;
}

interface ConfigBotao {
  cena: Scene;
  posicao: Posicao;
  texto: string;
  aoClicar: () => void;
}

interface ConfigBotaoControle {
  cena: Scene;
  centro: Posicao;
  texto: '−' | '+';
  aoClicar: () => void;
}

export function desenharBotoesDeclaracao(config: ConfigDeclaracaoRenderer): void {
  const { gameArea, objetos } = config;
  const centro = {
    x: gameArea.x + gameArea.largura / 2,
    y: gameArea.y + gameArea.altura / 2,
  };

  objetos.push(...criarControleDeclaracao(config, centro));
}

function criarControleDeclaracao(config: ConfigDeclaracaoRenderer, centro: Posicao): Phaser.GameObjects.GameObject[] {
  const { cena, maximo, onSelecionar, gameArea, valorInicial = 0, onAlterar } = config;
  let valor = valorInicial;
  const numero = criarNumero(cena, { x: centro.x, y: centro.y + escalar(4, cena) }, valor);
  const definirValor = (novoValor: number): void => {
    valor = novoValor;
    numero.setText(String(valor));
    onAlterar?.(valor);
  };
  const diminuir = (): void => {
    definirValor(Math.max(0, valor - 1));
  };
  const aumentar = (): void => {
    definirValor(Math.min(maximo, valor + 1));
  };
  const confirmar = (): void => {
    onSelecionar(valor);
  };
  return [
    criarTitulo(cena, { x: centro.x, y: centro.y - escalar(34, cena) }, gameArea),
    criarBotaoControle({ cena, centro, texto: '−', aoClicar: diminuir }),
    numero,
    criarBotaoControle({ cena, centro, texto: '+', aoClicar: aumentar }),
    criarConfirmacao(cena, centro, confirmar),
  ];
}

function criarTitulo(cena: Scene, posicao: Posicao, gameArea: Retangulo): Phaser.GameObjects.Text {
  return cena.add
    .text(posicao.x, posicao.y, textoTitulo(gameArea), {
      fontSize: `${String(escalar(tamanhoTitulo(gameArea), cena))}px`,
      color: '#ffffff',
      fontFamily: 'Arial',
      align: 'center',
    })
    .setOrigin(0.5);
}

function textoTitulo(gameArea: Retangulo): string {
  return larguraVisual(gameArea) < 420 ? 'Quantas vai\nfazer?' : 'Declare quantas vai fazer:';
}

function tamanhoTitulo(gameArea: Retangulo): number {
  return larguraVisual(gameArea) < 420 ? 15 : 20;
}

function larguraVisual(gameArea: Retangulo): number {
  return gameArea.largura / (window.devicePixelRatio || 1);
}

function criarNumero(cena: Scene, posicao: Posicao, valor: number): Phaser.GameObjects.Text {
  return cena.add
    .text(posicao.x, posicao.y, String(valor), {
      fontSize: `${String(escalar(24, cena))}px`,
      color: '#f1c40f',
      fontFamily: 'Arial',
    })
    .setOrigin(0.5);
}

function criarBotaoControle(config: ConfigBotaoControle): Phaser.GameObjects.Text {
  const { cena, centro, texto, aoClicar } = config;
  const direcao = texto === '−' ? -1 : 1;
  return criarBotao({
    cena,
    posicao: { x: centro.x + direcao * escalar(48, cena), y: centro.y + escalar(4, cena) },
    texto,
    aoClicar,
  });
}

function criarConfirmacao(cena: Scene, centro: Posicao, aoClicar: () => void): Phaser.GameObjects.Text {
  return criarBotao({
    cena,
    posicao: { x: centro.x, y: centro.y + escalar(48, cena) },
    texto: 'Confirmar',
    aoClicar,
  });
}

function criarBotao(config: ConfigBotao): Phaser.GameObjects.Text {
  const { cena, posicao, texto, aoClicar } = config;
  return cena.add
    .text(posicao.x, posicao.y, texto, {
      fontSize: `${String(escalar(24, cena))}px`,
      color: '#f1c40f',
      fontFamily: 'Arial',
      backgroundColor: '#2c3e50',
      padding: { x: escalar(8, cena), y: escalar(4, cena) },
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', aoClicar);
}

export function limparObjetosDeclaracao(objetos: Phaser.GameObjects.GameObject[]): void {
  objetos.forEach((obj) => {
    obj.destroy();
  });
  objetos.length = 0;
}
