import type { Scene } from 'phaser';

/**
 * Abaixo desta menor dimensão (px CSS) a UI mantém o tamanho atual (fator 1).
 * Telas com menor dimensão maior que isso ampliam a UI proporcionalmente.
 */
const REFERENCIA_TELA = 480;
/** Teto da ampliação para não exagerar em monitores muito grandes. */
const FATOR_MAXIMO = 2;

export function obterDpr(cena: Scene): number {
  return 1 / cena.game.scale.zoom;
}

/**
 * Fator de ampliação da UI conforme o tamanho da tela.
 * Usa a menor dimensão (px CSS) para garantir que o layout continue cabendo:
 * vale 1 em telas pequenas (celulares) e cresce até {@link FATOR_MAXIMO}.
 */
export function fatorTela(cena: Scene): number {
  const zoom = cena.game.scale.zoom;
  const larguraCss = cena.scale.width * zoom;
  const alturaCss = cena.scale.height * zoom;
  const menorDimensao = Math.min(larguraCss, alturaCss);
  if (!Number.isFinite(menorDimensao) || menorDimensao <= 0) {
    return 1;
  }
  return Math.min(FATOR_MAXIMO, Math.max(1, menorDimensao / REFERENCIA_TELA));
}

/** Fator total que converte unidades lógicas em pixels físicos do canvas. */
export function fatorEscala(cena: Scene): number {
  return obterDpr(cena) * fatorTela(cena);
}

export function escalar(valor: number, cena: Scene): number {
  return Math.round(valor * fatorEscala(cena));
}

export function escalarFonte(tamanhoPx: number, cena: Scene): string {
  return `${String(escalar(tamanhoPx, cena))}px`;
}
