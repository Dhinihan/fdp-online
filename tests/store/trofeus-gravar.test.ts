import { describe, expect, it } from 'vitest';
import { registrarTrofeusNoArmazenamento } from '@/store/trofeus/gravar-trofeus';
import { CHAVE_TROFEUS, type SnapshotTrofeus } from '@/store/trofeus/tipos';
import type { Jogador } from '@/types/entidades';

function armazenamentoFake(inicial?: string): Pick<Storage, 'getItem' | 'setItem'> & { dados: Map<string, string> } {
  const dados = new Map<string, string>();
  if (inicial !== undefined) dados.set(CHAVE_TROFEUS, inicial);
  return {
    dados,
    getItem: (chave) => dados.get(chave) ?? null,
    setItem: (chave, valor) => {
      dados.set(chave, valor);
    },
  };
}

function snapshotGravado(armazenamento: { dados: Map<string, string> }): SnapshotTrofeus {
  return JSON.parse(armazenamento.dados.get(CHAVE_TROFEUS) ?? '') as SnapshotTrofeus;
}

function armazenamentoQueLanca(metodo: 'getItem' | 'setItem'): Pick<Storage, 'getItem' | 'setItem'> {
  const falhar = (): never => {
    throw new DOMException('storage indisponível', 'SecurityError');
  };
  return { getItem: () => null, setItem: () => undefined, [metodo]: falhar };
}

function jogador(id: string, nome: string, perfilId?: string): Jogador {
  return { id, nome, pontos: 0, perfilId };
}

const humanoVenceu: Jogador[] = [jogador('humano', 'Você'), jogador('bot1', 'Brás', 'bras')];
const humanoPerdeu: Jogador[] = [jogador('bot1', 'Brás', 'bras'), jogador('humano', 'Você')];

function snapshotInicial(sequenciaAtual: number): string {
  return JSON.stringify({ versao: 1, sequenciaAtual, maiorTrofeu: null });
}

describe('registrarTrofeusNoArmazenamento quando o humano vence', () => {
  it('grava a sequência incrementada na chave de troféus e retorna o resultado', () => {
    const armazenamento = armazenamentoFake(snapshotInicial(2));

    const resultado = registrarTrofeusNoArmazenamento(() => armazenamento, humanoVenceu);

    expect(snapshotGravado(armazenamento)).toEqual({ versao: 1, sequenciaAtual: 3, maiorTrofeu: 'bronze' });
    expect(resultado).toEqual({ sequenciaAtual: 3, trofeuDesbloqueado: 'bronze' });
  });

  it('parte do zero quando ainda não havia snapshot', () => {
    const armazenamento = armazenamentoFake();

    const resultado = registrarTrofeusNoArmazenamento(() => armazenamento, humanoVenceu);

    expect(resultado).toEqual({ sequenciaAtual: 1, trofeuDesbloqueado: null });
  });

  it('parte do zero quando o snapshot existente está corrompido', () => {
    const armazenamento = armazenamentoFake('{ corrompido');

    const resultado = registrarTrofeusNoArmazenamento(() => armazenamento, humanoVenceu);

    expect(resultado).toEqual({ sequenciaAtual: 1, trofeuDesbloqueado: null });
  });

  it('persiste o maiorTrofeu desbloqueado e o devolve no resultado', () => {
    const armazenamento = armazenamentoFake(JSON.stringify({ versao: 1, sequenciaAtual: 4, maiorTrofeu: 'bronze' }));

    const resultado = registrarTrofeusNoArmazenamento(() => armazenamento, humanoVenceu);

    expect(snapshotGravado(armazenamento)).toEqual({ versao: 1, sequenciaAtual: 5, maiorTrofeu: 'prata' });
    expect(resultado).toEqual({ sequenciaAtual: 5, trofeuDesbloqueado: 'prata' });
  });
});

describe('registrarTrofeusNoArmazenamento quando o humano não vence', () => {
  it('zera a sequência persistida e não retorna nada a exibir', () => {
    const armazenamento = armazenamentoFake(snapshotInicial(5));

    const resultado = registrarTrofeusNoArmazenamento(() => armazenamento, humanoPerdeu);

    expect(snapshotGravado(armazenamento)).toEqual({ versao: 1, sequenciaAtual: 0, maiorTrofeu: null });
    expect(resultado).toBeNull();
  });
});

describe('registrarTrofeusNoArmazenamento — resiliência a falha de Storage', () => {
  it('não propaga falha de escrita e retorna resultado neutro', () => {
    const armazenamento = armazenamentoQueLanca('setItem');

    let resultado: unknown;
    expect(() => {
      resultado = registrarTrofeusNoArmazenamento(() => armazenamento, humanoVenceu);
    }).not.toThrow();
    expect(resultado).toBeNull();
  });

  it('absorve falha de leitura e retorna resultado neutro', () => {
    const armazenamento = armazenamentoQueLanca('getItem');

    expect(registrarTrofeusNoArmazenamento(() => armazenamento, humanoVenceu)).toBeNull();
  });

  it('absorve falha do próprio getter de Storage', () => {
    const obterArmazenamento = (): never => {
      throw new DOMException('storage bloqueado', 'SecurityError');
    };

    expect(registrarTrofeusNoArmazenamento(obterArmazenamento, humanoVenceu)).toBeNull();
  });
});
