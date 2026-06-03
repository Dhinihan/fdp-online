import { describe, expect, it } from 'vitest';
import { resumirTrofeus } from '@/store/trofeus/resumo-trofeus';
import type { SnapshotTrofeus } from '@/store/trofeus/tipos';

function snapshot(sequenciaAtual: number, maiorTrofeu: SnapshotTrofeus['maiorTrofeu']): SnapshotTrofeus {
  return { versao: 1, sequenciaAtual, maiorTrofeu };
}

describe('resumirTrofeus', () => {
  it('não há resumo enquanto nenhum Troféu foi conquistado', () => {
    expect(resumirTrofeus(snapshot(2, null))).toBeNull();
  });

  it('resume a partir do primeiro Bronze', () => {
    expect(resumirTrofeus(snapshot(3, 'bronze'))).toEqual({
      maiorTrofeu: 'bronze',
      sequenciaAtual: 3,
    });
  });

  it('resume o maior Troféu já conquistado com a sequência atual', () => {
    expect(resumirTrofeus(snapshot(100, 'diamante'))).toEqual({
      maiorTrofeu: 'diamante',
      sequenciaAtual: 100,
    });
  });
});
