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
  espacamentoHorizontal: number;
  espacamentoVertical: number;
  alturaCarta: number;
  quantidadeCartas: number;
  dpr: number;
}

export function calcularPosicoes(config: ConfigPosicoes): PosicaoTela[] {
  const {
    gameArea,
    margem,
    margemInferior,
    espacamentoHorizontal,
    espacamentoVertical,
    alturaCarta,
    quantidadeCartas,
    dpr,
  } = config;
  const { x: ox, y: oy, largura, altura } = gameArea;
  const cx = ox + Math.round(largura / 2);
  const cy = oy + Math.round(altura / 2);
  const offsetBase = Math.round(10 * dpr);
  const offsetLateral = Math.round(60 * dpr);
  const dl = alturaCarta / 2 + offsetBase;
  return [
    posicaoHumano({ cx, oy, altura, margemInferior, dl, espacamento: espacamentoHorizontal, quantidadeCartas }),
    posicaoBotEsquerda({ ox, margem, cy, dl, espacamento: espacamentoVertical, offsetLateral, offsetBase }),
    posicaoBotTopo({ cx, oy, margem, dl, espacamento: espacamentoHorizontal, quantidadeCartas }),
    posicaoBotDireita({ ox, largura, margem, cy, dl, espacamento: espacamentoVertical, offsetLateral, offsetBase }),
  ];
}

function posicaoHumano(cfg: {
  cx: number;
  oy: number;
  altura: number;
  margemInferior: number;
  dl: number;
  espacamento: number;
  quantidadeCartas: number;
}): PosicaoTela {
  const { cx, oy, altura, margemInferior, dl, espacamento, quantidadeCartas } = cfg;
  const baseY = oy + altura;
  const inicioX = calcularInicioCentralizado(cx, quantidadeCartas, espacamento);
  return {
    labelX: cx,
    labelY: Math.round(baseY - margemInferior + dl),
    mao: {
      x: inicioX,
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
  quantidadeCartas: number;
}): PosicaoTela {
  const { cx, oy, margem, dl, espacamento, quantidadeCartas } = cfg;
  const inicioX = calcularInicioCentralizado(cx, quantidadeCartas, espacamento);
  return {
    labelX: cx,
    labelY: Math.round(oy + margem - dl),
    mao: {
      x: inicioX,
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

function calcularInicioCentralizado(cx: number, quantidadeCartas: number, espacamento: number): number {
  const larguraMao = Math.max(0, quantidadeCartas - 1) * espacamento;
  return Math.round(cx - larguraMao / 2);
}
