import { describe, expect, it } from 'vitest';
import {
  calcularGeometriaLista,
  clampOffsetRolagem,
  contemPonteiroNaRegiao,
  offsetMaximoRolagem,
  precisaRolar,
  type RegiaoLista,
} from '@/adapters/phaser/scenes/geometria-rolagem-tabela-ranking';

describe('offsetMaximoRolagem', () => {
  it('deve ser zero quando o conteúdo cabe na área visível', () => {
    expect(offsetMaximoRolagem(300, 400)).toBe(0);
  });

  it('deve ser zero quando o conteúdo é exatamente do tamanho visível', () => {
    expect(offsetMaximoRolagem(400, 400)).toBe(0);
  });

  it('deve ser a sobra quando o conteúdo transborda', () => {
    expect(offsetMaximoRolagem(700, 400)).toBe(300);
  });
});

describe('precisaRolar', () => {
  it('deve retornar false quando a lista curta cabe na tela', () => {
    expect(precisaRolar(300, 400)).toBe(false);
  });

  it('deve retornar true quando o roster ultrapassa a área visível', () => {
    expect(precisaRolar(700, 400)).toBe(true);
  });
});

describe('clampOffsetRolagem', () => {
  it('deve prender no topo quando o deslocamento é negativo', () => {
    expect(clampOffsetRolagem(-50, 300)).toBe(0);
  });

  it('deve prender no fim quando o deslocamento passa do limite', () => {
    expect(clampOffsetRolagem(500, 300)).toBe(300);
  });

  it('deve preservar o deslocamento dentro dos limites', () => {
    expect(clampOffsetRolagem(120, 300)).toBe(120);
  });
});

describe('calcularGeometriaLista', () => {
  const entrada = {
    esquerda: 16,
    direita: 616,
    primeiraLinhaTopo: 258,
    fundo: 800,
    alturaLinha: 48,
    totalLinhas: 21,
  };

  it('deve montar a região retangular do corpo da tabela', () => {
    expect(calcularGeometriaLista(entrada).regiao).toEqual({
      esquerda: 16,
      direita: 616,
      topo: 258,
      fundo: 800,
    });
  });

  it('deve derivar a altura visível como fundo menos topo', () => {
    expect(calcularGeometriaLista(entrada).alturaVisivel).toBe(542);
  });

  it('deve derivar a altura do conteúdo como total de linhas vezes a altura da linha', () => {
    expect(calcularGeometriaLista(entrada).alturaConteudo).toBe(21 * 48);
  });
});

describe('contemPonteiroNaRegiao', () => {
  const regiao: RegiaoLista = { esquerda: 16, direita: 616, topo: 258, fundo: 800 };

  it('deve aceitar um ponto dentro do retângulo', () => {
    expect(contemPonteiroNaRegiao(regiao, { x: 300, y: 500 })).toBe(true);
  });

  it('deve aceitar pontos exatamente na borda', () => {
    expect(contemPonteiroNaRegiao(regiao, { x: 16, y: 258 })).toBe(true);
    expect(contemPonteiroNaRegiao(regiao, { x: 616, y: 800 })).toBe(true);
  });

  it('deve rejeitar um ponto acima da lista (header/controles)', () => {
    expect(contemPonteiroNaRegiao(regiao, { x: 300, y: 100 })).toBe(false);
  });

  it('deve rejeitar um ponto à direita do corpo da tabela', () => {
    expect(contemPonteiroNaRegiao(regiao, { x: 700, y: 500 })).toBe(false);
  });
});
