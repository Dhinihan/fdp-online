import { describe, expect, it } from 'vitest';
import {
  montarConteudoTutorial,
  montarEscadaHorizontal,
  montarEscadaVertical,
} from '@/adapters/tutorial/tutorial-conteudo';

describe('escada de força do tutorial', () => {
  it('deve listar as 13 cartas da mais forte para a mais fraca na horizontal', () => {
    const html = montarEscadaHorizontal();
    const cartas = [...html.matchAll(/>([^<]+)<\/div>/g)].map((m) => m[1]);
    expect(cartas).toEqual(['3', '2', 'A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4']);
  });

  it('deve marcar 3, 2 e Ás como naturais fortes (top) na horizontal', () => {
    const html = montarEscadaHorizontal();
    expect((html.match(/carta top/g) ?? []).length).toBe(3);
  });

  it('deve decrescer a altura das cartas conforme a força cai', () => {
    const alturas = [...montarEscadaHorizontal().matchAll(/height:(\d+)px/g)].map((m) => Number(m[1]));
    expect(alturas[0]).toBe(84);
    expect(alturas[alturas.length - 1]).toBe(24);
    expect(alturas).toEqual([...alturas].sort((a, b) => b - a));
  });

  it('deve decrescer a largura das barras na vertical', () => {
    const larguras = [...montarEscadaVertical().matchAll(/width:(\d+)%/g)].map((m) => Number(m[1]));
    expect(larguras[0]).toBe(100);
    expect(larguras[larguras.length - 1]).toBe(26);
  });
});

describe('conteúdo do tutorial', () => {
  it('deve trazer o objetivo, o ciclo, a manilha e as duas escadas', () => {
    const html = montarConteudoTutorial();
    expect(html).toContain('Sobreviva.');
    expect(html).toContain('Declare');
    expect(html).toContain('A manilha');
    expect(html).toContain('escada-h');
    expect(html).toContain('escada-v');
    expect(html).toContain('class="fechar"');
  });
});
