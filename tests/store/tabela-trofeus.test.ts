import { describe, expect, it } from 'vitest';
import {
  NIVEIS_ORDENADOS,
  ehNivel,
  limiarDe,
  proximoNivel,
  trofeuPara,
  type Nivel,
} from '@/store/trofeus/tabela-trofeus';

describe('trofeuPara devolve o Troféu correspondente a um comprimento de Sequência de Vitórias', () => {
  it('não conquista nada abaixo do primeiro limiar (Bronze 3)', () => {
    expect(trofeuPara(0)).toBeNull();
    expect(trofeuPara(2)).toBeNull();
  });

  it('conquista exatamente no limiar de cada nível', () => {
    expect(trofeuPara(3)).toBe('bronze');
    expect(trofeuPara(5)).toBe('prata');
    expect(trofeuPara(10)).toBe('ouro');
    expect(trofeuPara(15)).toBe('esmeralda');
    expect(trofeuPara(25)).toBe('safira');
    expect(trofeuPara(50)).toBe('rubi');
    expect(trofeuPara(100)).toBe('diamante');
  });

  it('mantém o nível anterior entre dois limiares', () => {
    expect(trofeuPara(4)).toBe('bronze');
    expect(trofeuPara(9)).toBe('prata');
    expect(trofeuPara(24)).toBe('esmeralda');
    expect(trofeuPara(99)).toBe('rubi');
  });

  it('mantém Diamante para qualquer comprimento acima do último limiar', () => {
    expect(trofeuPara(101)).toBe('diamante');
    expect(trofeuPara(1000)).toBe('diamante');
  });
});

describe('proximoNivel devolve o nível imediatamente acima de um dado Troféu', () => {
  it('parte de Bronze quando ainda não há Troféu (null)', () => {
    expect(proximoNivel(null)).toBe('bronze');
  });

  it('avança um nível na hierarquia ordenada', () => {
    expect(proximoNivel('bronze')).toBe('prata');
    expect(proximoNivel('prata')).toBe('ouro');
    expect(proximoNivel('ouro')).toBe('esmeralda');
    expect(proximoNivel('esmeralda')).toBe('safira');
    expect(proximoNivel('safira')).toBe('rubi');
    expect(proximoNivel('rubi')).toBe('diamante');
  });

  it('não há próximo nível após Diamante', () => {
    expect(proximoNivel('diamante')).toBeNull();
  });
});

describe('limiarDe devolve o comprimento de Sequência que conquista cada nível', () => {
  it('mapeia cada nível ao seu limiar', () => {
    expect(limiarDe('bronze')).toBe(3);
    expect(limiarDe('diamante')).toBe(100);
  });
});

describe('NIVEIS_ORDENADOS expõe os sete níveis em ordem ascendente', () => {
  it('lista os sete níveis na ordem dos limiares', () => {
    expect(NIVEIS_ORDENADOS).toEqual(['bronze', 'prata', 'ouro', 'esmeralda', 'safira', 'rubi', 'diamante']);
  });
});

describe('ehNivel reconhece níveis válidos', () => {
  it('aceita cada um dos sete níveis', () => {
    for (const nivel of NIVEIS_ORDENADOS) {
      expect(ehNivel(nivel)).toBe(true);
    }
  });

  it('rejeita valores que não são níveis', () => {
    expect(ehNivel('platina')).toBe(false);
    expect(ehNivel(null)).toBe(false);
    expect(ehNivel(3)).toBe(false);
    expect(ehNivel(undefined)).toBe(false);
  });
});

describe('propriedade: trofeuPara nunca pula um nível conforme o comprimento cresce', () => {
  it('o índice do Troféu sobe no máximo de 1 em 1 quando o comprimento incrementa', () => {
    let anterior: Nivel | null = null;
    for (let comprimento = 0; comprimento <= 120; comprimento++) {
      const atual = trofeuPara(comprimento);
      const indiceAtual = atual === null ? -1 : NIVEIS_ORDENADOS.indexOf(atual);
      const indiceAnterior = anterior === null ? -1 : NIVEIS_ORDENADOS.indexOf(anterior);
      expect(indiceAtual - indiceAnterior).toBeLessThanOrEqual(1);
      expect(indiceAtual - indiceAnterior).toBeGreaterThanOrEqual(0);
      anterior = atual;
    }
  });
});
