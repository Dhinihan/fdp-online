import type { Retangulo } from '../layout';
import type { PosicaoMao } from './mao-renderer';

export interface PosicaoTela {
  labelX: number;
  labelY: number;
  mao: PosicaoMao;
}

export interface ConfigPosicoes {
  gameArea: Retangulo;
  margem: number;
  margemInferior: number;
  espacamentoCartas: number;
  alturaCarta: number;
  dpr: number;
}

export function calcularPosicoes(config: ConfigPosicoes): PosicaoTela[] {
  const { gameArea, margem, margemInferior, espacamentoCartas, alturaCarta, dpr } = config;
  const { x: ox, y: oy, largura, altura } = gameArea;
  const cx = ox + Math.round(largura / 2);
  const cy = oy + Math.round(altura / 2);
  const offsetBase = Math.round(10 * dpr);
  const offsetLateral = Math.round(60 * dpr);
  const dl = alturaCarta / 2 + offsetBase;
  return [
    posicaoHumano({ cx, oy, altura, margemInferior, dl, espacamento: espacamentoCartas, offsetLateral }),
    posicaoBotEsquerda({ ox, margem, cy, dl, espacamento: espacamentoCartas, offsetLateral, offsetBase }),
    posicaoBotTopo({ cx, oy, margem, dl, espacamento: espacamentoCartas, offsetLateral }),
    posicaoBotDireita({ ox, largura, margem, cy, dl, espacamento: espacamentoCartas, offsetLateral, offsetBase }),
  ];
}

function posicaoHumano(cfg: {
  cx: number;
  oy: number;
  altura: number;
  margemInferior: number;
  dl: number;
  espacamento: number;
  offsetLateral: number;
}): PosicaoTela {
  const { cx, oy, altura, margemInferior, dl, espacamento, offsetLateral } = cfg;
  const baseY = oy + altura;
  return {
    labelX: cx,
    labelY: Math.round(baseY - margemInferior + dl),
    mao: {
      x: cx - offsetLateral,
      y: Math.round(baseY - margemInferior),
      espacamento,
      direcao: 'horizontal',
    },
  };
}

function posicaoBotEsquerda(cfg: {
  ox: number;
  margem: number;
  cy: number;
  dl: number;
  espacamento: number;
  offsetLateral: number;
  offsetBase: number;
}): PosicaoTela {
  const { ox, margem, cy, dl, espacamento, offsetLateral, offsetBase } = cfg;
  return {
    labelX: ox + margem,
    labelY: Math.round(cy - offsetLateral - dl - offsetBase),
    mao: {
      x: ox + margem,
      y: Math.round(cy - offsetLateral),
      espacamento,
      direcao: 'vertical',
    },
  };
}

function posicaoBotTopo(cfg: {
  cx: number;
  oy: number;
  margem: number;
  dl: number;
  espacamento: number;
  offsetLateral: number;
}): PosicaoTela {
  const { cx, oy, margem, dl, espacamento, offsetLateral } = cfg;
  return {
    labelX: cx,
    labelY: Math.round(oy + margem - dl),
    mao: {
      x: cx - offsetLateral,
      y: oy + margem,
      espacamento,
      direcao: 'horizontal',
    },
  };
}

function posicaoBotDireita(cfg: {
  ox: number;
  largura: number;
  margem: number;
  cy: number;
  dl: number;
  espacamento: number;
  offsetLateral: number;
  offsetBase: number;
}): PosicaoTela {
  const { ox, largura, margem, cy, dl, espacamento, offsetLateral, offsetBase } = cfg;
  const direita = ox + largura;
  return {
    labelX: Math.round(direita - margem),
    labelY: Math.round(cy - offsetLateral - dl - offsetBase),
    mao: {
      x: Math.round(direita - margem),
      y: Math.round(cy - offsetLateral),
      espacamento,
      direcao: 'vertical',
    },
  };
}
