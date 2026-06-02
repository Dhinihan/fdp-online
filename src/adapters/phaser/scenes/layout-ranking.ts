import type { Scene } from 'phaser';
import { escalar } from '../escala';

const MAX_FAIXA = 600;
const COL_METRICA = 84;
const GAP = 6;
const PARTICIPANTES_VISIVEIS_SEM_SCROLL = 7;

export interface LayoutRanking {
  faixa: { esquerda: number; largura: number; direita: number };
  podio: { topo: number; intervalo: number };
  controle: { yRotulo: number; ySegmentos: number; altura: number };
  tabela: { topo: number; direita: number; larguraColuna: number; gap: number; alturaLinha: number };
}

export function calcularLayoutRanking(cena: Scene): LayoutRanking {
  const faixa = calcularFaixa(cena);
  const controle = { yRotulo: escalar(190, cena), ySegmentos: escalar(224, cena), altura: escalar(40, cena) };
  const topoTabela = escalar(258, cena);
  return {
    faixa,
    podio: { topo: escalar(66, cena), intervalo: escalar(124, cena) },
    controle,
    tabela: {
      topo: topoTabela,
      direita: faixa.direita - escalar(12, cena),
      larguraColuna: escalar(COL_METRICA, cena),
      gap: escalar(GAP, cena),
      alturaLinha: calcularAlturaLinha(cena, topoTabela),
    },
  };
}

function calcularFaixa(cena: Scene): LayoutRanking['faixa'] {
  const margem = escalar(16, cena);
  const largura = Math.min(cena.cameras.main.width - margem * 2, escalar(MAX_FAIXA, cena));
  const esquerda = (cena.cameras.main.width - largura) / 2;
  return { esquerda, largura, direita: esquerda + largura };
}

function calcularAlturaLinha(cena: Scene, topoTabela: number): number {
  const fimTabela = cena.cameras.main.height - escalar(18, cena);
  const alturaDisponivel = fimTabela - topoTabela - escalar(34, cena);
  const alturaCompacta = Math.floor(alturaDisponivel / PARTICIPANTES_VISIVEIS_SEM_SCROLL);
  return Math.max(escalar(48, cena), Math.min(escalar(64, cena), alturaCompacta));
}
