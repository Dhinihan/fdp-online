import { describe, expect, it } from 'vitest';
import { formatarDelta } from './resumo-rodada-renderer';

describe('formatarDelta', () => {
  it('deve mostrar (0) em verde quando a penalidade é zero', () => {
    expect(formatarDelta(0)).toEqual({ texto: '(0)', cor: '#4ade80' });
  });

  it('deve mostrar a penalidade negativa em vermelho quando perdeu pontos', () => {
    expect(formatarDelta(3)).toEqual({ texto: '(-3)', cor: '#ff6b6b' });
  });

  it('deve formatar penalidade de um ponto como (-1)', () => {
    expect(formatarDelta(1).texto).toBe('(-1)');
  });
});
