import type { Retangulo } from './layout';

export interface ConfigLayoutManilha {
  area: Retangulo;
  cartaLargura: number;
  cartaAltura: number;
  margem: number;
  gapCartaLabel: number;
  alturaLabel: number;
  ehPaisagem: boolean;
}

export interface LayoutManilha {
  cartaX: number;
  cartaY: number;
  escala: number;
  labelX: number;
  labelY: number;
}

/** `area` e dimensões da carta devem estar no mesmo espaço de pixels (device px). */
export function calcularLayoutManilha(config: ConfigLayoutManilha): LayoutManilha {
  const { area, cartaAltura, margem, gapCartaLabel, alturaLabel, ehPaisagem } = config;
  const escala = calcularEscalaMaxima(config);
  const alturaEfetiva = cartaAltura * escala;
  const blocoAltura = alturaEfetiva + gapCartaLabel + alturaLabel;
  const cartaX = area.x + area.largura / 2;

  const topoBloco = ehPaisagem ? area.y + area.altura - margem - blocoAltura : area.y + (area.altura - blocoAltura) / 2;

  const cartaY = topoBloco + alturaEfetiva / 2;
  const labelY = topoBloco + alturaEfetiva + gapCartaLabel + alturaLabel / 2;

  return { cartaX, cartaY, escala, labelX: cartaX, labelY };
}

function calcularEscalaMaxima(config: ConfigLayoutManilha): number {
  const { area, cartaLargura, cartaAltura, margem, gapCartaLabel, alturaLabel } = config;
  const larguraDisponivel = area.largura - margem * 2;
  const alturaDisponivel = area.altura - margem * 2 - gapCartaLabel - alturaLabel;
  const escalaLargura = larguraDisponivel / cartaLargura;
  const escalaAltura = alturaDisponivel / cartaAltura;

  return Math.min(1, escalaLargura, escalaAltura);
}

export function calcularAreaManilha(area: Retangulo, ehPaisagem: boolean): Retangulo {
  if (ehPaisagem) return area;
  return {
    x: area.x + Math.round(area.largura * 0.65),
    y: area.y,
    largura: Math.round(area.largura * 0.35),
    altura: area.altura,
  };
}
