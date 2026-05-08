import { describe, it, expect } from 'vitest';
import { MaquinaFases } from '@/core/maquina-fases';

describe('MaquinaFases — construção', () => {
  it('deve iniciar na fase distribuindo por padrão', () => {
    const maquina = new MaquinaFases();
    expect(maquina.atual).toBe('distribuindo');
  });

  it('deve permitir iniciar em qualquer fase', () => {
    const maquina = new MaquinaFases('aguardandoJogada');
    expect(maquina.atual).toBe('aguardandoJogada');
  });
});

describe('MaquinaFases — consulta', () => {
  it('deve retornar true quando a fase atual corresponde', () => {
    const maquina = new MaquinaFases('aguardandoJogada');
    expect(maquina.eh('aguardandoJogada')).toBe(true);
  });

  it('deve retornar false quando a fase atual não corresponde', () => {
    const maquina = new MaquinaFases('aguardandoJogada');
    expect(maquina.eh('aguardandoDeclaracao')).toBe(false);
  });
});

describe('MaquinaFases — transições válidas', () => {
  it.each([
    ['distribuindo', 'aguardandoDeclaracao'],
    ['aguardandoDeclaracao', 'processandoDeclaracao'],
    ['processandoDeclaracao', 'aguardandoDeclaracao'],
    ['processandoDeclaracao', 'aguardandoJogada'],
    ['aguardandoJogada', 'processandoTurno'],
    ['processandoTurno', 'aguardandoJogada'],
    ['processandoTurno', 'rodadaConcluida'],
  ] as const)('deve transitar de %s para %s', (de, para) => {
    const maquina = new MaquinaFases(de);
    maquina.transitar(para);
    expect(maquina.atual).toBe(para);
  });
});

describe('MaquinaFases — transições inválidas', () => {
  it.each([
    ['distribuindo', 'aguardandoJogada'],
    ['aguardandoJogada', 'aguardandoDeclaracao'],
    ['rodadaConcluida', 'distribuindo'],
    ['aguardandoDeclaracao', 'rodadaConcluida'],
  ] as const)('deve rejeitar transição de %s para %s', (de, para) => {
    const maquina = new MaquinaFases(de);
    expect(() => {
      maquina.transitar(para);
    }).toThrow('Transição inválida');
  });
});

describe('MaquinaFases — definir', () => {
  it('deve definir a fase sem validação', () => {
    const maquina = new MaquinaFases('distribuindo');
    maquina.definir('rodadaConcluida');
    expect(maquina.atual).toBe('rodadaConcluida');
  });
});
