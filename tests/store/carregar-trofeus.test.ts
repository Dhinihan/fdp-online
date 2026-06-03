import { describe, expect, it } from 'vitest';
import { CHAVE_TROFEUS, lerSnapshot } from '@/store/trofeus/carregar-trofeus';
import { SNAPSHOT_ZERO } from '@/store/trofeus/tipos';

function armazenamentoCom(valor: string | null): Pick<Storage, 'getItem'> {
  return { getItem: (chave) => (chave === CHAVE_TROFEUS ? valor : null) };
}

function bruto(corpo: unknown): string {
  return JSON.stringify(corpo);
}

describe('lerSnapshot de troféus trata conteúdo ausente ou malformado como estado zero', () => {
  it('quando a chave está ausente', () => {
    expect(lerSnapshot(armazenamentoCom(null))).toEqual(SNAPSHOT_ZERO);
  });

  it('quando o conteúdo é um JSON inválido', () => {
    expect(lerSnapshot(armazenamentoCom('{ não é json'))).toEqual(SNAPSHOT_ZERO);
  });

  it('quando o conteúdo não é um objeto', () => {
    expect(lerSnapshot(armazenamentoCom(bruto(42)))).toEqual(SNAPSHOT_ZERO);
  });

  it('quando a versão não é 1', () => {
    expect(lerSnapshot(armazenamentoCom(bruto({ versao: 2, sequenciaAtual: 3, maiorTrofeu: null })))).toEqual(
      SNAPSHOT_ZERO,
    );
  });
});

describe('lerSnapshot de troféus trata invariantes violadas como estado zero', () => {
  it('quando a sequência não é numérica', () => {
    expect(lerSnapshot(armazenamentoCom(bruto({ versao: 1, sequenciaAtual: '3', maiorTrofeu: null })))).toEqual(
      SNAPSHOT_ZERO,
    );
  });

  it('quando a sequência é negativa (invariante violada)', () => {
    expect(lerSnapshot(armazenamentoCom(bruto({ versao: 1, sequenciaAtual: -1, maiorTrofeu: null })))).toEqual(
      SNAPSHOT_ZERO,
    );
  });

  it('quando a sequência é fracionária', () => {
    expect(lerSnapshot(armazenamentoCom(bruto({ versao: 1, sequenciaAtual: 2.5, maiorTrofeu: null })))).toEqual(
      SNAPSHOT_ZERO,
    );
  });

  it('quando maiorTrofeu não é um nível conhecido', () => {
    expect(lerSnapshot(armazenamentoCom(bruto({ versao: 1, sequenciaAtual: 3, maiorTrofeu: 'platina' })))).toEqual(
      SNAPSHOT_ZERO,
    );
  });

  it('quando maiorTrofeu não é nem nível nem null', () => {
    expect(lerSnapshot(armazenamentoCom(bruto({ versao: 1, sequenciaAtual: 3, maiorTrofeu: 7 })))).toEqual(
      SNAPSHOT_ZERO,
    );
  });
});

describe('lerSnapshot de troféus', () => {
  it('lê um snapshot válido tal como persistido', () => {
    const valido = { versao: 1, sequenciaAtual: 4, maiorTrofeu: null };

    expect(lerSnapshot(armazenamentoCom(bruto(valido)))).toEqual(valido);
  });

  it('lê um snapshot com maiorTrofeu válido (Troféu já conquistado)', () => {
    const valido = { versao: 1, sequenciaAtual: 0, maiorTrofeu: 'ouro' };

    expect(lerSnapshot(armazenamentoCom(bruto(valido)))).toEqual(valido);
  });

  it('aceita a sequência zerada como válida', () => {
    expect(lerSnapshot(armazenamentoCom(bruto({ versao: 1, sequenciaAtual: 0, maiorTrofeu: null })))).toEqual(
      SNAPSHOT_ZERO,
    );
  });
});
