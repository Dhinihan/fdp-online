import { describe, expect, it } from 'vitest';
import { CHAVE_RANKING, carregarRanking } from '@/store/ranking/carregar-ranking';

function armazenamentoCom(valor: string | null): Pick<Storage, 'getItem'> {
  return { getItem: (chave) => (chave === CHAVE_RANKING ? valor : null) };
}

describe('carregarRanking', () => {
  it('deve retornar ranking vazio quando a chave está ausente', () => {
    const ranking = carregarRanking(armazenamentoCom(null));

    expect(ranking.participantes).toEqual([]);
  });

  it('deve retornar ranking vazio quando o conteúdo é um JSON inválido', () => {
    const ranking = carregarRanking(armazenamentoCom('{ não é json'));

    expect(ranking.participantes).toEqual([]);
  });

  it('deve retornar ranking vazio quando os participantes não são uma lista', () => {
    const ranking = carregarRanking(armazenamentoCom(JSON.stringify({ versao: 1, participantes: 'x' })));

    expect(ranking.participantes).toEqual([]);
  });

  it('deve retornar ranking vazio quando o conteúdo não é um objeto', () => {
    const ranking = carregarRanking(armazenamentoCom(JSON.stringify(42)));

    expect(ranking.participantes).toEqual([]);
  });

  it('deve preservar os participantes de um snapshot válido', () => {
    const conteudo = JSON.stringify({
      versao: 1,
      participantes: [{ nome: 'Você', humano: true, vitorias: 2, partidas: 5, somaPosicoes: 9 }],
    });

    const ranking = carregarRanking(armazenamentoCom(conteudo));

    expect(ranking.participantes).toHaveLength(1);
    expect(ranking.participantes[0].nome).toBe('Você');
  });
});
