import type { PosicaoMao } from './mao-renderer';

export interface PosicaoTela {
  labelX: number;
  labelY: number;
  mao: PosicaoMao;
}

export interface ConfigPosicoes {
  largura: number;
  altura: number;
  margem: number;
  margemInferior: number;
  espacamentoCartas: number;
  alturaCarta: number;
}

export function calcularPosicoes(config: ConfigPosicoes): PosicaoTela[] {
  const { largura, altura, margem, margemInferior, espacamentoCartas, alturaCarta } = config;
  const cx = Math.round(largura / 2);
  const cy = Math.round(altura / 2);
  const dl = alturaCarta / 2 + 10;
  return [
    posicaoHumano({ cx, altura, margemInferior, dl, espacamento: espacamentoCartas }),
    posicaoBotEsquerda({ margem, cy, dl, espacamento: espacamentoCartas }),
    posicaoBotTopo({ cx, margem, dl, espacamento: espacamentoCartas }),
    posicaoBotDireita({ largura, margem, cy, dl, espacamento: espacamentoCartas }),
  ];
}

function posicaoHumano(config: {
  cx: number;
  altura: number;
  margemInferior: number;
  dl: number;
  espacamento: number;
}): PosicaoTela {
  return {
    labelX: config.cx,
    labelY: Math.round(config.altura - config.margemInferior + config.dl),
    mao: {
      x: config.cx - 60,
      y: Math.round(config.altura - config.margemInferior),
      espacamento: config.espacamento,
      direcao: 'horizontal',
    },
  };
}

function posicaoBotEsquerda(config: { margem: number; cy: number; dl: number; espacamento: number }): PosicaoTela {
  return {
    labelX: config.margem,
    labelY: Math.round(config.cy - 60 - config.dl),
    mao: { x: config.margem, y: Math.round(config.cy - 60), espacamento: config.espacamento, direcao: 'vertical' },
  };
}

function posicaoBotTopo(config: { cx: number; margem: number; dl: number; espacamento: number }): PosicaoTela {
  return {
    labelX: config.cx,
    labelY: Math.round(config.margem - config.dl),
    mao: { x: config.cx - 60, y: config.margem, espacamento: config.espacamento, direcao: 'horizontal' },
  };
}

function posicaoBotDireita(config: {
  largura: number;
  margem: number;
  cy: number;
  dl: number;
  espacamento: number;
}): PosicaoTela {
  return {
    labelX: Math.round(config.largura - config.margem),
    labelY: Math.round(config.cy - 60 - config.dl),
    mao: {
      x: Math.round(config.largura - config.margem),
      y: Math.round(config.cy - 60),
      espacamento: config.espacamento,
      direcao: 'vertical',
    },
  };
}
