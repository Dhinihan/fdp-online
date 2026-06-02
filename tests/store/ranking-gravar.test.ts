import { describe, expect, it } from 'vitest';
import { registrarPartidaNoArmazenamento } from '@/store/ranking/gravar-ranking';
import { CHAVE_RANKING, type SnapshotRanking } from '@/store/ranking/tipos';
import type { Jogador } from '@/types/entidades';

function armazenamentoFake(inicial?: string): Pick<Storage, 'getItem' | 'setItem'> & { dados: Map<string, string> } {
  const dados = new Map<string, string>();
  if (inicial !== undefined) dados.set(CHAVE_RANKING, inicial);
  return {
    dados,
    getItem: (chave) => dados.get(chave) ?? null,
    setItem: (chave, valor) => {
      dados.set(chave, valor);
    },
  };
}

function snapshotGravado(armazenamento: { dados: Map<string, string> }): SnapshotRanking {
  return JSON.parse(armazenamento.dados.get(CHAVE_RANKING) ?? '') as SnapshotRanking;
}

function armazenamentoQueLanca(metodo: 'getItem' | 'setItem'): Pick<Storage, 'getItem' | 'setItem'> {
  const falhar = (): never => {
    throw new DOMException('storage indisponível', 'SecurityError');
  };
  return { getItem: () => null, setItem: () => undefined, [metodo]: falhar };
}

function jogador(id: string, nome: string): Jogador {
  return { id, nome, pontos: 0 };
}

const classificacao: Jogador[] = [jogador('humano', 'Você'), jogador('bot1', 'Brás')];

describe('registrarPartidaNoArmazenamento', () => {
  it('grava o snapshot da primeira partida na chave do Ranking', () => {
    const armazenamento = armazenamentoFake();

    registrarPartidaNoArmazenamento(armazenamento, classificacao);

    const gravado = snapshotGravado(armazenamento);
    expect(gravado.versao).toBe(1);
    expect(gravado.participantes['humano']).toMatchObject({ partidas: 1, vitorias: 1, somaPosicoes: 1 });
    expect(gravado.participantes['bot:bras']).toMatchObject({ partidas: 1, vitorias: 0, somaPosicoes: 2 });
  });

  it('acumula sobre o snapshot já gravado', () => {
    const inicial = JSON.stringify({
      versao: 1,
      participantes: { humano: { nomeExibicao: 'Você', partidas: 1, vitorias: 0, somaPosicoes: 2 } },
    });
    const armazenamento = armazenamentoFake(inicial);

    registrarPartidaNoArmazenamento(armazenamento, classificacao);

    expect(snapshotGravado(armazenamento).participantes['humano']).toMatchObject({
      partidas: 2,
      vitorias: 1,
      somaPosicoes: 3,
    });
  });

  it('parte do zero quando o snapshot existente está corrompido', () => {
    const armazenamento = armazenamentoFake('{ corrompido');

    registrarPartidaNoArmazenamento(armazenamento, classificacao);

    expect(snapshotGravado(armazenamento).participantes['humano']).toMatchObject({ partidas: 1 });
  });
});

describe('registrarPartidaNoArmazenamento — resiliência a falha de Storage', () => {
  it('não propaga falha de escrita (quota excedida)', () => {
    const armazenamento = armazenamentoQueLanca('setItem');

    expect(() => {
      registrarPartidaNoArmazenamento(armazenamento, classificacao);
    }).not.toThrow();
  });

  it('absorve falha de leitura (modo privado/SecurityError)', () => {
    const armazenamento = armazenamentoQueLanca('getItem');

    expect(() => {
      registrarPartidaNoArmazenamento(armazenamento, classificacao);
    }).not.toThrow();
  });
});
