import { describe, expect, it } from 'vitest';
import { resumirTrofeus } from '@/store/trofeus/resumo-trofeus';
import type { SnapshotTrofeus } from '@/store/trofeus/tipos';

function snapshot(sequenciaAtual: number, maiorTrofeu: SnapshotTrofeus['maiorTrofeu']): SnapshotTrofeus {
  return { versao: 1, sequenciaAtual, maiorTrofeu };
}

describe('resumirTrofeus', () => {
  it('não mostra resumo enquanto nenhum Troféu foi conquistado', () => {
    expect(resumirTrofeus(snapshot(2, null))).toEqual({
      mostrar: false,
      maiorTrofeu: null,
      sequenciaAtual: 2,
      proximoNivel: 'bronze',
      faltam: 1,
    });
  });
});

describe('resumirTrofeus quando há Troféu conquistado', () => {
  it('mostra resumo a partir do primeiro Bronze e calcula quanto falta para Prata', () => {
    expect(resumirTrofeus(snapshot(3, 'bronze'))).toEqual({
      mostrar: true,
      maiorTrofeu: 'bronze',
      sequenciaAtual: 3,
      proximoNivel: 'prata',
      faltam: 2,
    });
  });

  it('calcula faltam como distância da sequência atual até o próximo nível', () => {
    expect(resumirTrofeus(snapshot(42, 'safira'))).toMatchObject({
      mostrar: true,
      proximoNivel: 'rubi',
      faltam: 8,
    });
  });

  it('não tem próximo nível nem faltam quando o maior Troféu é Diamante', () => {
    expect(resumirTrofeus(snapshot(100, 'diamante'))).toEqual({
      mostrar: true,
      maiorTrofeu: 'diamante',
      sequenciaAtual: 100,
      proximoNivel: null,
      faltam: null,
    });
  });
});
