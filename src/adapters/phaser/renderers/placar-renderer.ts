import type { Scene } from 'phaser';
import type { Jogador } from '@/types/entidades';
import type { EstadoRodada } from '@/types/estado-rodada';
import { estadoEmJogo } from '@/types/estado-rodada';
import { escalar, escalarFonte } from '../escala';

interface ConfigPlacar {
  cena: Scene;
  jogadores: Jogador[];
  estado: EstadoRodada;
  objetos: Phaser.GameObjects.GameObject[];
}

interface LinhaPlacar {
  jogador: Jogador;
  declarado: number | null;
  feito: number;
  pontos: number;
}

interface TextoPlacar {
  texto: string;
  x: number;
  y: number;
  cor: string;
}

interface ConfigLinhaPlacar {
  cena: Scene;
  objetos: Phaser.GameObjects.GameObject[];
  linha: LinhaPlacar;
  indice: number;
}

export function limparPlacar(objetos: Phaser.GameObjects.GameObject[]): void {
  objetos.forEach((objeto) => {
    objeto.destroy();
  });
  objetos.length = 0;
}

export function desenharPlacar(config: ConfigPlacar): void {
  limparPlacar(config.objetos);
  const linhas = criarLinhas(config.jogadores, config.estado);
  desenharFundo(config.cena, config.objetos, linhas.length);
  desenharCabecalho(config.cena, config.objetos);
  linhas.forEach((linha, indice) => {
    desenharLinha({ cena: config.cena, objetos: config.objetos, linha, indice });
  });
}

function criarLinhas(jogadores: Jogador[], estado: EstadoRodada): LinhaPlacar[] {
  const emJogo = estadoEmJogo(estado);
  return jogadores.map((jogador) => ({
    jogador,
    declarado: emJogo.declaracoes[jogador.id] ?? null,
    feito: emJogo.vazas[jogador.id] ?? 0,
    pontos: emJogo.pontos[jogador.id] ?? jogador.pontos,
  }));
}

function desenharFundo(cena: Scene, objetos: Phaser.GameObjects.GameObject[], totalLinhas: number): void {
  const largura = escalar(214, cena);
  const altura = escalar(34 + totalLinhas * 24, cena);
  const fundo = cena.add.rectangle(escalar(10, cena), escalar(10, cena), largura, altura, 0x101827, 0.82);
  fundo.setOrigin(0, 0).setStrokeStyle(escalar(1, cena), 0xffffff, 0.18).setDepth(50);
  objetos.push(fundo);
}

function desenharCabecalho(cena: Scene, objetos: Phaser.GameObjects.GameObject[]): void {
  const y = escalar(18, cena);
  adicionarTexto(cena, objetos, { texto: 'Jogador', x: 18, y, cor: '#dbeafe' });
  adicionarTexto(cena, objetos, { texto: 'D', x: 102, y, cor: '#dbeafe' });
  adicionarTexto(cena, objetos, { texto: 'F', x: 132, y, cor: '#dbeafe' });
  adicionarTexto(cena, objetos, { texto: 'Pts', x: 164, y, cor: '#dbeafe' });
}

function desenharLinha(config: ConfigLinhaPlacar): void {
  const { cena, objetos, linha, indice } = config;
  const y = escalar(42 + indice * 24, cena);
  const declarado = linha.declarado === null ? '-' : String(linha.declarado);
  const corPontos = linha.pontos < 0 ? '#ff6b6b' : '#ffffff';
  adicionarTexto(cena, objetos, { texto: linha.jogador.nome, x: 18, y, cor: '#ffffff' });
  adicionarTexto(cena, objetos, { texto: declarado, x: 106, y, cor: '#ffffff' });
  adicionarTexto(cena, objetos, { texto: String(linha.feito), x: 136, y, cor: '#ffffff' });
  adicionarTexto(cena, objetos, { texto: String(linha.pontos), x: 170, y, cor: corPontos });
}

function adicionarTexto(cena: Scene, objetos: Phaser.GameObjects.GameObject[], config: TextoPlacar): void {
  const objeto = cena.add
    .text(escalar(config.x, cena), config.y, config.texto, {
      fontSize: escalarFonte(11, cena),
      color: config.cor,
      fontFamily: 'Arial',
    })
    .setOrigin(0, 0.5)
    .setDepth(51);
  objetos.push(objeto);
}
