import { describe, expect, it } from 'vitest';
import { CHAVE_RANKING, carregarRanking } from '@/store/ranking/carregar-ranking';

function armazenamentoCom(valor: string | null): Pick<Storage, 'getItem'> {
  return { getItem: (chave) => (chave === CHAVE_RANKING ? valor : null) };
}

function snapshot(participantes: unknown[], versao: unknown = 1): string {
  return JSON.stringify({ versao, participantes });
}

const participanteValido = { nome: 'Você', humano: true, vitorias: 2, partidas: 5, somaPosicoes: 9 };

describe('carregarRanking trata como vazio', () => {
  it('quando a chave está ausente', () => {
    expect(carregarRanking(armazenamentoCom(null))).toEqual({ tipo: 'vazio' });
  });

  it('quando o conteúdo é um JSON inválido', () => {
    expect(carregarRanking(armazenamentoCom('{ não é json'))).toEqual({ tipo: 'vazio' });
  });

  it('quando o conteúdo não é um objeto', () => {
    expect(carregarRanking(armazenamentoCom(JSON.stringify(42)))).toEqual({ tipo: 'vazio' });
  });

  it('quando a versão não é 1', () => {
    expect(carregarRanking(armazenamentoCom(snapshot([participanteValido], 2)))).toEqual({ tipo: 'vazio' });
  });

  it('quando os participantes não são uma lista', () => {
    const conteudo = JSON.stringify({ versao: 1, participantes: 'x' });
    expect(carregarRanking(armazenamentoCom(conteudo))).toEqual({ tipo: 'vazio' });
  });

  it('quando a lista de participantes está vazia', () => {
    expect(carregarRanking(armazenamentoCom(snapshot([])))).toEqual({ tipo: 'vazio' });
  });
});

describe('carregarRanking rejeita participante inválido', () => {
  it('quando um item da lista é nulo', () => {
    expect(carregarRanking(armazenamentoCom(snapshot([participanteValido, null])))).toEqual({ tipo: 'vazio' });
  });

  it('quando uma métrica não é numérica', () => {
    const corrompido = { ...participanteValido, vitorias: '2' };
    expect(carregarRanking(armazenamentoCom(snapshot([corrompido])))).toEqual({ tipo: 'vazio' });
  });

  it('quando falta o nome', () => {
    const semNome = { humano: true, vitorias: 2, partidas: 5, somaPosicoes: 9 };
    expect(carregarRanking(armazenamentoCom(snapshot([semNome])))).toEqual({ tipo: 'vazio' });
  });
});

describe('carregarRanking', () => {
  it('deve retornar populado com os participantes de um snapshot válido', () => {
    const ranking = carregarRanking(armazenamentoCom(snapshot([participanteValido])));

    expect(ranking.tipo).toBe('populado');
    expect(ranking).toMatchObject({ tipo: 'populado', participantes: [{ nome: 'Você' }] });
  });
});
