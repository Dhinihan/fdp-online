import { describe, expect, it } from 'vitest';
import { calcularLayout } from '@/adapters/phaser/layout';
import { calcularAreaManilha, calcularLayoutManilha } from '@/adapters/phaser/layout-manilha';
import { ALTURA, LARGURA } from '@/adapters/phaser/renderers/carta-renderer';
import {
  ALTURA_LABEL_BASE,
  GAP_CARTA_LABEL_BASE,
  MARGEM_BASE,
} from '@/adapters/phaser/renderers/painel-manilha-renderer';

function criarConfig(area: { x: number; y: number; largura: number; altura: number }, ehPaisagem: boolean) {
  return {
    area,
    cartaLargura: LARGURA,
    cartaAltura: ALTURA,
    margem: MARGEM_BASE,
    gapCartaLabel: GAP_CARTA_LABEL_BASE,
    alturaLabel: ALTURA_LABEL_BASE,
    ehPaisagem,
  };
}

function limitesCarta(layout: ReturnType<typeof calcularLayoutManilha>) {
  const metadeLargura = (LARGURA * layout.escala) / 2;
  const metadeAltura = (ALTURA * layout.escala) / 2;
  return {
    esquerda: layout.cartaX - metadeLargura,
    direita: layout.cartaX + metadeLargura,
    topo: layout.cartaY - metadeAltura,
    base: layout.cartaY + metadeAltura,
  };
}

describe('calcularLayoutManilha — escala', () => {
  it('deve usar escala 1 em desktop paisagem com área ampla', () => {
    const { infoArea } = calcularLayout(1280, 720);
    const layout = calcularLayoutManilha(criarConfig(infoArea, true));

    expect(layout.escala).toBe(1);
  });

  it('deve reduzir escala em viewport retrato estreito', () => {
    const { infoArea } = calcularLayout(320, 568);
    const area = calcularAreaManilha(infoArea, false);
    const layout = calcularLayoutManilha(criarConfig(area, false));

    expect(layout.escala).toBeLessThan(1);
  });

  it('nunca deve ultrapassar escala 1', () => {
    const { infoArea } = calcularLayout(1920, 1080);
    const area = calcularAreaManilha(infoArea, true);
    const layout = calcularLayoutManilha(criarConfig(area, true));

    expect(layout.escala).toBeLessThanOrEqual(1);
  });
});

describe('calcularLayoutManilha — contenção', () => {
  it('deve manter carta e label dentro da área em mobile retrato', () => {
    const { infoArea } = calcularLayout(390, 844);
    const area = calcularAreaManilha(infoArea, false);
    const layout = calcularLayoutManilha(criarConfig(area, false));
    const carta = limitesCarta(layout);

    expect(carta.esquerda).toBeGreaterThanOrEqual(area.x + MARGEM_BASE);
    expect(carta.direita).toBeLessThanOrEqual(area.x + area.largura - MARGEM_BASE);
    expect(carta.topo).toBeGreaterThanOrEqual(area.y + MARGEM_BASE);
    expect(layout.labelY + ALTURA_LABEL_BASE / 2).toBeLessThanOrEqual(area.y + area.altura - MARGEM_BASE);
  });

  it('deve manter carta e label dentro da área em viewport estreito', () => {
    const { infoArea } = calcularLayout(320, 568);
    const area = calcularAreaManilha(infoArea, false);
    const layout = calcularLayoutManilha(criarConfig(area, false));
    const carta = limitesCarta(layout);

    expect(carta.esquerda).toBeGreaterThanOrEqual(area.x + MARGEM_BASE);
    expect(carta.direita).toBeLessThanOrEqual(area.x + area.largura - MARGEM_BASE);
    expect(carta.topo).toBeGreaterThanOrEqual(area.y + MARGEM_BASE);
    expect(layout.labelY + ALTURA_LABEL_BASE / 2).toBeLessThanOrEqual(area.y + area.altura - MARGEM_BASE);
  });
});

describe('calcularLayoutManilha — posicionamento', () => {
  it('deve alinhar manilha na parte inferior em paisagem', () => {
    const { infoArea } = calcularLayout(1280, 720);
    const layout = calcularLayoutManilha(criarConfig(infoArea, true));
    const carta = limitesCarta(layout);

    expect(layout.cartaX).toBe(infoArea.x + infoArea.largura / 2);
    expect(carta.base).toBeLessThanOrEqual(infoArea.y + infoArea.altura - MARGEM_BASE + 0.5);
    expect(carta.base).toBeGreaterThan(infoArea.y + infoArea.altura * 0.7);
  });

  it('deve centralizar manilha na coluna direita em retrato', () => {
    const { infoArea } = calcularLayout(390, 844);
    const area = calcularAreaManilha(infoArea, false);
    const layout = calcularLayoutManilha(criarConfig(area, false));
    const carta = limitesCarta(layout);
    const blocoAltura = ALTURA * layout.escala + GAP_CARTA_LABEL_BASE + ALTURA_LABEL_BASE;
    const centroBloco = (carta.topo + layout.labelY + ALTURA_LABEL_BASE / 2) / 2;
    const centroEsperado = area.y + area.altura / 2;

    expect(layout.cartaX).toBe(area.x + area.largura / 2);
    expect(centroBloco).toBeCloseTo(centroEsperado, 0);
    expect(blocoAltura).toBeLessThanOrEqual(area.altura - MARGEM_BASE * 2);
  });
});
