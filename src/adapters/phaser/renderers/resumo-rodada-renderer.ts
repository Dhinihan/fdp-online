import type { Scene } from 'phaser';
import type { Jogador } from '@/types/entidades';
import { escalar, escalarFonte } from '../escala';
import { limparObjetos } from './limpar-objetos';

export interface ConfigResumoRodada {
  cena: Scene;
  numeroRodada: number;
  jogadores: Jogador[];
  placar: Record<string, number>;
  penalidades: Record<string, number>;
  objetos: Phaser.GameObjects.GameObject[];
  onContinuar: () => void;
}

interface LayoutResumo {
  larguraCartao: number;
  alturaCartao: number;
  centroX: number;
  centroY: number;
  yTitulo: number;
  yPrimeiraLinha: number;
  alturaLinha: number;
  yBotao: number;
}

function formatarDelta(penalidade: number): { texto: string; cor: string } {
  if (penalidade === 0) return { texto: '(0)', cor: '#4ade80' };
  return { texto: `(-${String(penalidade)})`, cor: '#ff6b6b' };
}

export function mostrarResumoRodada(config: ConfigResumoRodada): void {
  const { cena, objetos, jogadores } = config;
  const layout = calcularLayout(cena, jogadores.length);
  desenharFundoEscurecido(cena, objetos);
  desenharCard(cena, objetos, layout);
  desenharTitulo(cena, objetos, {
    centroX: layout.centroX,
    y: layout.yTitulo,
    numeroRodada: config.numeroRodada,
  });
  jogadores.forEach((jogador, indice) => {
    desenharLinhaJogador(cena, objetos, {
      jogador,
      pontos: config.placar[jogador.id],
      penalidade: config.penalidades[jogador.id],
      centroX: layout.centroX,
      y: layout.yPrimeiraLinha + indice * layout.alturaLinha,
    });
  });
  desenharBotaoContinuar(config, { centroX: layout.centroX, y: layout.yBotao });
}

function calcularLayout(cena: Scene, totalJogadores: number): LayoutResumo {
  const cam = cena.cameras.main;
  const centroX = cam.width / 2;
  const centroY = cam.height / 2;
  const alturaLinha = escalar(34, cena);
  const espacamento = escalar(32, cena);
  const alturaTitulo = escalar(44, cena);
  const gapBotao = escalar(28, cena);
  const alturaBotao = escalar(56, cena);
  const larguraCartao = escalar(320, cena);
  const alturaCartao = espacamento + alturaTitulo + totalJogadores * alturaLinha + gapBotao + alturaBotao + espacamento;
  const topo = centroY - alturaCartao / 2;
  const yTitulo = topo + espacamento + alturaTitulo / 2;
  const yPrimeiraLinha = topo + espacamento + alturaTitulo + alturaLinha / 2;
  const yBotao = topo + alturaCartao - espacamento - alturaBotao / 2;
  return { larguraCartao, alturaCartao, centroX, centroY, yTitulo, yPrimeiraLinha, alturaLinha, yBotao };
}

function desenharFundoEscurecido(cena: Scene, objetos: Phaser.GameObjects.GameObject[]): void {
  const cam = cena.cameras.main;
  const fundo = cena.add
    .rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0x000000, 0.75)
    .setDepth(300)
    .setInteractive();
  objetos.push(fundo);
}

function desenharCard(cena: Scene, objetos: Phaser.GameObjects.GameObject[], layout: LayoutResumo): void {
  const card = cena.add
    .rectangle(layout.centroX, layout.centroY, layout.larguraCartao, layout.alturaCartao, 0x1f2937, 1)
    .setDepth(301);
  card.setStrokeStyle(escalar(2, cena), 0x374151);
  objetos.push(card);
}

interface ArgsTitulo {
  centroX: number;
  y: number;
  numeroRodada: number;
}

function desenharTitulo(cena: Scene, objetos: Phaser.GameObjects.GameObject[], args: ArgsTitulo): void {
  const texto = cena.add
    .text(args.centroX, args.y, `Resumo da Rodada ${String(args.numeroRodada)}`, {
      fontSize: escalarFonte(20, cena),
      color: '#facc15',
      fontStyle: 'bold',
      fontFamily: 'Arial',
    })
    .setOrigin(0.5)
    .setDepth(302);
  objetos.push(texto);
}

interface ArgsLinha {
  jogador: Jogador;
  pontos: number;
  penalidade: number;
  centroX: number;
  y: number;
}

function desenharLinhaJogador(cena: Scene, objetos: Phaser.GameObjects.GameObject[], args: ArgsLinha): void {
  const fonte = escalarFonte(16, cena);
  const { texto: textoDelta, cor } = formatarDelta(args.penalidade);
  const esquerda = criarTexto(cena, `${args.jogador.nome}: ${String(args.pontos)} `, { fonte, cor: '#ffffff' });
  const delta = criarTexto(cena, textoDelta, { fonte, cor });
  esquerda.setY(args.y);
  delta.setY(args.y);
  const inicio = args.centroX - (esquerda.width + delta.width) / 2;
  esquerda.setX(inicio);
  delta.setX(inicio + esquerda.width);
  objetos.push(esquerda, delta);
}

function criarTexto(cena: Scene, texto: string, estilo: { fonte: string; cor: string }): Phaser.GameObjects.Text {
  return cena.add
    .text(0, 0, texto, { fontSize: estilo.fonte, color: estilo.cor, fontFamily: 'Arial' })
    .setOrigin(0, 0.5)
    .setDepth(302);
}

interface ArgsBotao {
  centroX: number;
  y: number;
}

function desenharBotaoContinuar(config: ConfigResumoRodada, args: ArgsBotao): void {
  const { cena, objetos } = config;
  const largura = escalar(200, cena);
  const altura = escalar(56, cena);
  const grafico = cena.add.graphics().setDepth(302);
  grafico.fillStyle(0x4ecca3, 1);
  grafico.fillRoundedRect(args.centroX - largura / 2, args.y - altura / 2, largura, altura, escalar(12, cena));
  const texto = cena.add
    .text(args.centroX, args.y, 'Continuar', { fontSize: escalarFonte(24, cena), fontStyle: 'bold', color: '#ffffff' })
    .setOrigin(0.5)
    .setDepth(303);
  const zona = cena.add
    .zone(args.centroX, args.y, largura, altura)
    .setDepth(303)
    .setInteractive({ useHandCursor: true });
  zona.on('pointerdown', () => {
    limparObjetos(objetos);
    config.onContinuar();
  });
  objetos.push(grafico, texto, zona);
}
