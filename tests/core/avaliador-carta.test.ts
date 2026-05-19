import { describe, expect, it } from 'vitest';
import { avaliarCartas, parametrosAvaliacaoPadrao } from '@/core/avaliador-carta';
import { criarCarta } from './rodada-fixtures';

describe('avaliador-carta', () => {
  it('deve classificar 4 de ouros como baixa', () => {
    const [avaliada] = avaliarCartas([criarCarta('4', '♦')], '5', [], 4);

    expect(avaliada.categoria).toBe('baixa');
  });

  it('deve classificar 3 de paus não-manilha como alta', () => {
    const [avaliada] = avaliarCartas([criarCarta('3', '♣')], '4', [], 4);

    expect(avaliada.categoria).toBe('alta');
  });

  it('deve classificar manilha de paus como segura', () => {
    const [avaliada] = avaliarCartas([criarCarta('4', '♣')], '4', [], 4);

    expect(avaliada.categoria).toBe('segura');
  });

  it('deve classificar manilha de ouros como alta', () => {
    const [avaliada] = avaliarCartas([criarCarta('4', '♦')], '4', [], 4);

    expect(avaliada.categoria).toBe('alta');
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
    expect(comReveladas[0].categoria).toBe('alta');
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
  it('deve exportar parâmetros padrão editáveis separadamente', () => {
    expect(typeof parametrosAvaliacaoPadrao.baseManilha).toBe('number');
    expect(typeof parametrosAvaliacaoPadrao.limiarAlta).toBe('number');
    expect(typeof parametrosAvaliacaoPadrao.limiarBaixa).toBe('number');
    expect(typeof parametrosAvaliacaoPadrao.limiarSegura).toBe('number');
    expect(typeof parametrosAvaliacaoPadrao.pesoDensidade).toBe('number');
  });
});
