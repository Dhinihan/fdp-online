import { describe, expect, it } from 'vitest';
import { lerMesa } from '@/adapters/bots/ler-mesa';
import { criarCarta } from '../core/rodada-fixtures';
import { criarEstadoComDoisPorAgir, criarEstadoComUmPorAgir, criarEstadoLinhaFria } from './fixtures-linha-fria';

const maoBasica = [criarCarta('4', '♦'), criarCarta('7', '♦'), criarCarta('A', '♦')];

describe('lerMesa mesa vazia', () => {
  it('deve marcar líder nulo e todas as cartas como vencedoras', () => {
    const estado = criarEstadoLinhaFria({ declaracoes: { bot: 2 }, vazas: { bot: 0 } });
    const leitura = lerMesa(estado, maoBasica);

    expect(leitura.lider).toBeNull();
    expect(leitura.vencedoras).toHaveLength(3);
    expect(leitura.perdedoras).toHaveLength(0);
    expect(leitura.empates).toHaveLength(0);
    expect(leitura.jogadoresPorAgir).toBe(3);
    expect(leitura.liderQuerVaza).toBe(false);
    expect(leitura.avaliadas).toHaveLength(maoBasica.length);
  });
});

describe('lerMesa mesa com carta', () => {
  it('deve classificar vencedoras e perdedoras em relação ao líder', () => {
    const estado = criarEstadoComUmPorAgir({
      declaracoes: { j2: 1, j3: 0 },
      vazas: { j2: 0, j3: 1 },
      mesa: [
        { jogadorId: 'j1', carta: criarCarta('8', '♣') },
        { jogadorId: 'bot', carta: criarCarta('6', '♣') },
      ],
    });
    const mao = [criarCarta('3', '♦'), criarCarta('4', '♦')];
    const leitura = lerMesa(estado, mao);

    expect(leitura.lider?.carta).toEqual(criarCarta('8', '♣'));
    expect(leitura.vencedoras).toHaveLength(1);
    expect(leitura.perdedoras).toHaveLength(1);
    expect(leitura.empates).toHaveLength(0);
    expect(leitura.jogadoresPorAgir).toBe(1);
  });
});

describe('lerMesa posição e urgência', () => {
  it('deve filtrar interessados por agir e detectar alvo', () => {
    const estado = criarEstadoComDoisPorAgir({
      declaracoes: { j2: 1, j3: 1, bot: 0 },
      vazas: { j2: 0, j3: 0, bot: 0 },
    });
    const leitura = lerMesa(estado, [criarCarta('5', '♦'), criarCarta('9', '♦')]);

    expect(leitura.jogadoresPorAgir).toBe(2);
    expect(leitura.interessadosPorAgir).toEqual(['j3']);
    expect(leitura.temAlvo).toBe(true);
    expect(leitura.urgenciaAlta).toBe(false);
  });

  it('deve marcar urgência alta quando necessidade cobre dois terços da mão', () => {
    const estado = criarEstadoLinhaFria({ declaracoes: { bot: 2 }, vazas: { bot: 0 } });
    const leitura = lerMesa(estado, maoBasica);

    expect(leitura.necessidade).toBe(2);
    expect(leitura.urgenciaAlta).toBe(true);
    expect(leitura.folga).toBe(1);
  });
});

describe('lerMesa avaliação única', () => {
  it('deve incluir o líder no mesmo lote de avaliação da mão', () => {
    const estado = criarEstadoComUmPorAgir({
      mesa: [{ jogadorId: 'j1', carta: criarCarta('K', '♣') }],
      manilha: '5',
    });
    const leitura = lerMesa(estado, maoBasica);

    expect(leitura.avaliadas).toHaveLength(maoBasica.length);
    expect(leitura.lider?.carta).toEqual(criarCarta('K', '♣'));
    expect(leitura.jogadorId).toBe(estado.maos[estado.jogadorAtual].jogador.id);
  });
});
