import type { Scene } from 'phaser';
import type { Jogador } from '@/types/entidades';
import { escalar, escalarFonte } from '../escala';
import type { Retangulo } from '../layout';
import { limparObjetos } from './limpar-objetos';

const COR_FUNDO = 0x16213e;
const COR_BORDA = 0xf1c40f;
const COR_NUMERO = '#f1c40f';
const PROFUNDIDADE_BADGE = 25;

export interface ConfigDeclaradoTurno0 {
  cena: Scene;
  jogadores: Jogador[];
  declaracoes: Record<string, number>;
  centrosMaos: { x: number; y: number }[];
  objetos: Phaser.GameObjects.GameObject[];
  gameArea: Retangulo;
  jogadorIdAnimar?: string;
}

export function renderizarBadgesDeclaradoTurno0(config: ConfigDeclaradoTurno0): void {
  const { cena, jogadores, declaracoes, centrosMaos, objetos, gameArea, jogadorIdAnimar } = config;
  limparObjetos(objetos);
  Object.entries(declaracoes).forEach(([jogadorId, valor]) => {
    const animar = jogadorIdAnimar !== undefined && jogadorId === jogadorIdAnimar;
    adicionarBadge({ cena, jogadores, jogadorId, valor, centrosMaos, objetos, gameArea, animar });
  });
}

interface ConfigBadge {
  cena: Scene;
  jogadores: Jogador[];
  jogadorId: string;
  valor: number;
  centrosMaos: { x: number; y: number }[];
  objetos: Phaser.GameObjects.GameObject[];
  gameArea: Retangulo;
  animar: boolean;
}

function adicionarBadge(config: ConfigBadge): void {
  const { cena, jogadores, jogadorId, valor, centrosMaos, objetos, gameArea, animar } = config;
  const indice = jogadores.findIndex((j) => j.id === jogadorId);
  if (indice < 0 || indice >= centrosMaos.length) return;
  const posicao = posicaoBadgeSobreCartas({ cena, centro: centrosMaos[indice], gameArea });
  const badge = criarBadge({ cena, x: posicao.x, y: posicao.y, valor });
  objetos.push(badge);
  if (animar) animarEntradaBadge(cena, badge);
}

interface ConfigPosicaoBadge {
  cena: Scene;
  centro: { x: number; y: number };
  gameArea: Retangulo;
}

function posicaoBadgeSobreCartas(config: ConfigPosicaoBadge): { x: number; y: number } {
  const { cena, centro, gameArea } = config;
  const raio = escalar(13, cena);
  return limitarDentroGameArea({ posicao: centro, raio, area: gameArea, margem: escalar(8, cena) });
}

interface ConfigLimitarArea {
  posicao: { x: number; y: number };
  raio: number;
  area: Retangulo;
  margem: number;
}

function limitarDentroGameArea(config: ConfigLimitarArea): { x: number; y: number } {
  const { posicao, raio, area, margem } = config;
  const minX = area.x + margem + raio;
  const maxX = area.x + area.largura - margem - raio;
  const minY = area.y + margem + raio;
  const maxY = area.y + area.altura - margem - raio;
  return {
    x: Math.min(maxX, Math.max(minX, posicao.x)),
    y: Math.min(maxY, Math.max(minY, posicao.y)),
  };
}

interface ConfigCriarBadge {
  cena: Scene;
  x: number;
  y: number;
  valor: number;
}

function criarBadge(config: ConfigCriarBadge): Phaser.GameObjects.Container {
  const { cena, x, y, valor } = config;
  const raio = escalar(13, cena);
  const container = cena.add.container(x, y).setDepth(PROFUNDIDADE_BADGE);
  const sombra = cena.add.circle(0, escalar(1, cena), raio, 0x000000, 0.4);
  const fundo = cena.add.circle(0, 0, raio, COR_FUNDO);
  const borda = cena.add.graphics();
  borda.lineStyle(escalar(2, cena), COR_BORDA, 1);
  borda.strokeCircle(0, 0, raio);
  const numero = cena.add
    .text(0, 0, String(valor), {
      fontSize: escalarFonte(15, cena),
      color: COR_NUMERO,
      fontFamily: 'Arial',
      fontStyle: 'bold',
    })
    .setOrigin(0.5);
  container.add([sombra, fundo, borda, numero]);
  return container;
}

function animarEntradaBadge(cena: Scene, badge: Phaser.GameObjects.Container): void {
  badge.setScale(0);
  cena.tweens.add({
    targets: badge,
    scale: 1,
    duration: 240,
    ease: 'Back.easeOut',
  });
}
