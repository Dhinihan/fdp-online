import type { PosicaoMao } from './mao-renderer';

export interface PosicaoTela {
  labelX: number;
  labelY: number;
  origemLabel?: { x: number; y: number };
  mao: PosicaoMao;
}

export interface ConfigPosicoes {
  largura: number;
  altura: number;
  margem: number;
  margemInferior: number;
  espacamentoCartas: number;
  alturaCarta: number;
  larguraCarta: number;
  dpr: number;
}

export function calcularPosicoes(config: ConfigPosicoes): PosicaoTela[] {
  const { largura, altura, margem, margemInferior, espacamentoCartas, alturaCarta, larguraCarta, dpr } = config;
  const cx = Math.round(largura / 2);
  const cy = Math.round(altura / 2);
  const offsetBase = Math.round(10 * dpr);
  const offsetLateral = Math.round(60 * dpr);
  const dl = alturaCarta / 2 + offsetBase;
  const padding = offsetBase;
  return [
    posicaoHumano({ cx, altura, margemInferior, dl, espacamento: espacamentoCartas, offsetLateral }),
    posicaoBotEsquerda({ margem, cy, dl, espacamento: espacamentoCartas, offsetLateral, larguraCarta, padding }),
    posicaoBotTopo({ cx, margem, dl, espacamento: espacamentoCartas, offsetLateral }),
    posicaoBotDireita({
      largura,
      margem,
      cy,
      dl,
      espacamento: espacamentoCartas,
      offsetLateral,
      larguraCarta,
      padding,
    }),
  ];
}

function posicaoHumano(config: {
  cx: number;
  altura: number;
  margemInferior: number;
  dl: number;
  espacamento: number;
  offsetLateral: number;
}): PosicaoTela {
  return {
    labelX: config.cx,
    labelY: Math.round(config.altura - config.margemInferior + config.dl),
    mao: {
      x: config.cx - config.offsetLateral,
      y: Math.round(config.altura - config.margemInferior),
      espacamento: config.espacamento,
      direcao: 'horizontal',
    },
  };
}

function posicaoBotEsquerda(config: {
  margem: number;
  cy: number;
  dl: number;
  espacamento: number;
  offsetLateral: number;
  larguraCarta: number;
  padding: number;
}): PosicaoTela {
  return {
    labelX: Math.round(config.margem + config.larguraCarta / 2 + config.padding),
    labelY: Math.round(config.cy - config.offsetLateral - config.dl),
    origemLabel: { x: 0, y: 0.5 },
    mao: {
      x: config.margem,
      y: Math.round(config.cy - config.offsetLateral),
      espacamento: config.espacamento,
      direcao: 'vertical',
    },
  };
}

function posicaoBotTopo(config: {
  cx: number;
  margem: number;
  dl: number;
  espacamento: number;
  offsetLateral: number;
}): PosicaoTela {
  return {
    labelX: config.cx,
    labelY: Math.round(config.margem - config.dl),
    mao: {
      x: config.cx - config.offsetLateral,
      y: config.margem,
      espacamento: config.espacamento,
      direcao: 'horizontal',
    },
  };
}

function posicaoBotDireita(config: {
  largura: number;
  margem: number;
  cy: number;
  dl: number;
  espacamento: number;
  offsetLateral: number;
  larguraCarta: number;
  padding: number;
}): PosicaoTela {
  return {
    labelX: Math.round(config.largura - config.margem - config.larguraCarta / 2 - config.padding),
    labelY: Math.round(config.cy - config.offsetLateral - config.dl),
    origemLabel: { x: 1, y: 0.5 },
    mao: {
      x: Math.round(config.largura - config.margem),
      y: Math.round(config.cy - config.offsetLateral),
      espacamento: config.espacamento,
      direcao: 'vertical',
    },
  };
}
