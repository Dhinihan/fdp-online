import { describe, it, expect } from 'vitest';
import { validarTransicaoFase } from '@/core/maquina-fases';

describe('validarTransicaoFase — transições válidas', () => {
  it.each([
    ['distribuindo', 'aguardandoDeclaracao'],
    ['aguardandoDeclaracao', 'processandoDeclaracao'],
    ['processandoDeclaracao', 'aguardandoDeclaracao'],
    ['processandoDeclaracao', 'aguardandoJogada'],
    ['aguardandoJogada', 'processandoTurno'],
    ['processandoTurno', 'aguardandoJogada'],
    ['processandoTurno', 'rodadaConcluida'],
  ] as const)('deve permitir transição de %s para %s', (de, para) => {
    expect(() => {
      validarTransicaoFase(de, para);
    }).not.toThrow();
  });
});

describe('validarTransicaoFase — transições inválidas', () => {
  it.each([
    ['distribuindo', 'aguardandoJogada'],
    ['aguardandoJogada', 'aguardandoDeclaracao'],
    ['rodadaConcluida', 'distribuindo'],
    ['aguardandoDeclaracao', 'rodadaConcluida'],
  ] as const)('deve rejeitar transição de %s para %s', (de, para) => {
    expect(() => {
      validarTransicaoFase(de, para);
    }).toThrow('Transição inválida');
  });
});
