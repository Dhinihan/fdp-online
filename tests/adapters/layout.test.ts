import { describe, it, expect } from 'vitest';
import { calcularLayout } from '@/adapters/phaser/layout';

describe('calcularLayout — paisagem', () => {
  it('deve retornar painel na lateral esquerda quando width > height', () => {
    const layout = calcularLayout(1200, 600);
    expect(layout.orientacao).toBe('paisagem');
    expect(layout.infoArea.x).toBe(0);
    expect(layout.infoArea.y).toBe(0);
    expect(layout.infoArea.altura).toBe(600);
    expect(layout.infoArea.largura).toBeGreaterThan(0);
    expect(layout.infoArea.largura).toBeLessThan(300);
    expect(layout.gameArea.x).toBe(layout.infoArea.largura);
    expect(layout.gameArea.y).toBe(0);
    expect(layout.gameArea.altura).toBe(600);
    expect(layout.gameArea.largura).toBe(1200 - layout.infoArea.largura);
  });

  it('deve considerar quadrado como paisagem', () => {
    expect(calcularLayout(600, 600).orientacao).toBe('paisagem');
  });

  it('deve ter largura base de ~18% da tela', () => {
    const layout = calcularLayout(1000, 500);
    const proporcao = layout.infoArea.largura / 1000;
    expect(proporcao).toBeGreaterThanOrEqual(0.15);
    expect(proporcao).toBeLessThanOrEqual(0.22);
  });
});

describe('calcularLayout — retrato', () => {
  it('deve retornar painel no topo quando height > width', () => {
    const layout = calcularLayout(400, 800);
    expect(layout.orientacao).toBe('retrato');
    expect(layout.infoArea.x).toBe(0);
    expect(layout.infoArea.y).toBe(0);
    expect(layout.infoArea.largura).toBe(400);
    expect(layout.infoArea.altura).toBeGreaterThan(0);
    expect(layout.infoArea.altura).toBeLessThan(200);
    expect(layout.gameArea.x).toBe(0);
    expect(layout.gameArea.y).toBe(layout.infoArea.altura);
    expect(layout.gameArea.largura).toBe(400);
    expect(layout.gameArea.altura).toBe(800 - layout.infoArea.altura);
  });

  it('deve ter altura base de ~18% da tela', () => {
    const layout = calcularLayout(300, 800);
    const proporcao = layout.infoArea.altura / 800;
    expect(proporcao).toBeGreaterThanOrEqual(0.15);
    expect(proporcao).toBeLessThanOrEqual(0.22);
  });
});

describe('calcularLayout — segurança', () => {
  it('a gameArea nunca deve ter tamanho negativo', () => {
    const layout = calcularLayout(100, 50);
    expect(layout.gameArea.largura).toBeGreaterThanOrEqual(0);
    expect(layout.gameArea.altura).toBeGreaterThanOrEqual(0);
  });
});
