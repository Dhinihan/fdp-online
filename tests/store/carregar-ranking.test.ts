import { describe, expect, it } from 'vitest';
import { CHAVE_RANKING, carregarRanking } from '@/store/ranking/carregar-ranking';

function armazenamentoCom(valor: string | null): Pick<Storage, 'getItem'> {
  return { getItem: (chave) => (chave === CHAVE_RANKING ? valor : null) };
}

function snapshot(participantes: unknown, versao: unknown = 1): string {
  return JSON.stringify({ versao, participantes });
}

const participanteValido = { nomeExibicao: 'Você', partidas: 5, vitorias: 2, somaPosicoes: 9 };

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
    expect(carregarRanking(armazenamentoCom(snapshot({ humano: participanteValido }, 2)))).toEqual({ tipo: 'vazio' });
  });

  it('quando os participantes são uma lista em vez de um Record', () => {
    expect(carregarRanking(armazenamentoCom(snapshot([participanteValido])))).toEqual({ tipo: 'vazio' });
  });

  it('quando o Record de participantes está vazio', () => {
    expect(carregarRanking(armazenamentoCom(snapshot({})))).toEqual({ tipo: 'vazio' });
  });
});

describe('carregarRanking rejeita participante inválido', () => {
  it('quando uma entrada é nula', () => {
    expect(carregarRanking(armazenamentoCom(snapshot({ humano: participanteValido, 'bot:bras': null })))).toEqual({
      tipo: 'vazio',
    });
  });

  it('quando uma métrica não é numérica', () => {
    const corrompido = { ...participanteValido, vitorias: '2' };
    expect(carregarRanking(armazenamentoCom(snapshot({ humano: corrompido })))).toEqual({ tipo: 'vazio' });
  });

  it('quando falta o nome de exibição', () => {
    const semNome = { partidas: 5, vitorias: 2, somaPosicoes: 9 };
    expect(carregarRanking(armazenamentoCom(snapshot({ humano: semNome })))).toEqual({ tipo: 'vazio' });
  });

  it('quando o nome de exibição é vazio', () => {
    const semNome = { ...participanteValido, nomeExibicao: '' };
    expect(carregarRanking(armazenamentoCom(snapshot({ humano: semNome })))).toEqual({ tipo: 'vazio' });
  });
});

describe('carregarRanking rejeita somatórios incoerentes', () => {
  const casos: Record<string, Partial<typeof participanteValido>> = {
    'partidas negativas': { partidas: -1 },
    'partidas fracionárias': { partidas: 2.5 },
    'sem nenhuma partida': { partidas: 0, vitorias: 0, somaPosicoes: 0 },
    'mais vitórias do que partidas': { partidas: 2, vitorias: 3, somaPosicoes: 4 },
    'soma de posições abaixo do total de partidas': { partidas: 5, vitorias: 1, somaPosicoes: 4 },
    'soma de posições negativa': { partidas: 5, vitorias: 1, somaPosicoes: -3 },
  };

  for (const [descricao, override] of Object.entries(casos)) {
    it(`quando há ${descricao}`, () => {
      const corrompido = { ...participanteValido, ...override };
      expect(carregarRanking(armazenamentoCom(snapshot({ humano: corrompido })))).toEqual({ tipo: 'vazio' });
    });
  }
});

describe('carregarRanking', () => {
  it('materializa o Record num participante com chave e flag humano', () => {
    const ranking = carregarRanking(
      armazenamentoCom(
        snapshot({ humano: participanteValido, 'bot:bras': { ...participanteValido, nomeExibicao: 'Brás' } }),
      ),
    );

    expect(ranking.tipo).toBe('populado');
    if (ranking.tipo !== 'populado') throw new Error('esperava populado');
    expect(ranking.participantes).toContainEqual({
      chave: 'humano',
      humano: true,
      nomeExibicao: 'Você',
      partidas: 5,
      vitorias: 2,
      somaPosicoes: 9,
    });
    expect(ranking.participantes).toContainEqual(
      expect.objectContaining({ chave: 'bot:bras', humano: false, nomeExibicao: 'Brás' }),
    );
  });
});
