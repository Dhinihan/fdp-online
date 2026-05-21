import { describe, expect, it } from 'vitest';
import { avaliarCartas, parametrosAvaliacaoPadrao } from '@/core/avaliador-carta';
import { criarCarta } from './rodada-fixtures';

describe('avaliador-carta', () => {
  it('deve classificar 4 de ouros como baixa', () => {
    const [avaliada] = avaliarCartas([criarCarta('4', '♦')], '5', [], 4);

    expect(avaliada.categoria).toBe('baixa');
  });
});

describe('avaliador-carta com seguras em rodadas pequenas', () => {
  it('deve classificar 3 de paus não-manilha como segura em N=3 com 4 jogadores', () => {
    const mao = [criarCarta('3', '♣'), criarCarta('K', '♦'), criarCarta('Q', '♦')];

    const [avaliada] = avaliarCartas(mao, '4', [], 4);

    expect(avaliada.categoria).toBe('segura');
  });

  it('deve classificar 3 de paus não-manilha abaixo de segura em N=5 com 4 jogadores', () => {
    const mao = [
      criarCarta('3', '♣'),
      criarCarta('K', '♦'),
      criarCarta('Q', '♦'),
      criarCarta('J', '♦'),
      criarCarta('10', '♦'),
    ];

    const [avaliada] = avaliarCartas(mao, '4', [], 4);

    expect(avaliada.categoria).toBe('alta');
  });

  it('deve classificar 3 de paus não-manilha como segura em N=1', () => {
    const [avaliada] = avaliarCartas([criarCarta('3', '♣')], '4', [], 4);

    expect(avaliada.categoria).toBe('segura');
  });

  it('deve classificar todas as manilhas como seguras em N=3 com 4 jogadores', () => {
    const mao = [criarCarta('4', '♣'), criarCarta('4', '♥'), criarCarta('4', '♠'), criarCarta('4', '♦')];

    const avaliadas = avaliarCartas(mao, '4', [], 4);

    expect(avaliadas.map((avaliada) => avaliada.categoria)).toEqual(['segura', 'segura', 'segura', 'segura']);
  });
});

describe('avaliador-carta com ajustes', () => {
  it('deve subir categoria quando cartas superiores foram reveladas', () => {
    const carta = criarCarta('K', '♥');
    const semReveladas = avaliarCartas([carta], '4', [], 4);
    const comReveladas = avaliarCartas(
      [carta],
      '4',
      [criarCarta('3', '♣'), criarCarta('3', '♥'), criarCarta('2', '♠'), criarCarta('A', '♦')],
      4,
    );

    expect(semReveladas[0].categoria).toBe('média');
    expect(comReveladas[0].categoria).toBe('segura');
  });
});

describe('avaliador-carta com densidade', () => {
  it('deve mover limiares com densidade alta sem reduzir o score', () => {
    const carta = criarCarta('8', '♠');
    const poucaDensidade = avaliarCartas([carta], '4', [], 2);
    const maoDensa = [
      carta,
      criarCarta('7', '♣'),
      criarCarta('7', '♥'),
      criarCarta('7', '♠'),
      criarCarta('7', '♦'),
      criarCarta('6', '♣'),
      criarCarta('6', '♥'),
      criarCarta('6', '♠'),
      criarCarta('6', '♦'),
      criarCarta('5', '♣'),
      criarCarta('5', '♥'),
      criarCarta('5', '♠'),
      criarCarta('5', '♦'),
    ];
    const altaDensidade = avaliarCartas(maoDensa, '4', [], 8);

    expect(poucaDensidade[0].score).toBe(altaDensidade[0].score);
    expect(poucaDensidade[0].categoria).toBe('baixa');
    expect(altaDensidade[0].categoria).toBe('média');
  });
});

describe('avaliador-carta contextual', () => {
  it('deve marcar 3 como garantida agora quando todos os 3s e manilhas foram revelados', () => {
    const reveladas = [
      criarCarta('3', '♣'),
      criarCarta('3', '♥'),
      criarCarta('3', '♠'),
      criarCarta('4', '♣'),
      criarCarta('4', '♥'),
      criarCarta('4', '♠'),
      criarCarta('4', '♦'),
    ];

    const [avaliada] = avaliarCartas([criarCarta('3', '♦')], '4', reveladas, 4);

    expect(avaliada.categoria).toBe('garantida_agora');
  });
});

describe('parametrosAvaliacaoPadrao', () => {
  it('deve usar limiar seguro base 12', () => {
    expect(parametrosAvaliacaoPadrao.limiarSegura).toBe(12);
  });

  it('deve exportar parâmetros padrão editáveis separadamente', () => {
    expect(typeof parametrosAvaliacaoPadrao.baseManilha).toBe('number');
    expect(typeof parametrosAvaliacaoPadrao.limiarAlta).toBe('number');
    expect(typeof parametrosAvaliacaoPadrao.limiarBaixa).toBe('number');
    expect(typeof parametrosAvaliacaoPadrao.limiarSegura).toBe('number');
    expect(typeof parametrosAvaliacaoPadrao.pesoDensidade).toBe('number');
  });
});
