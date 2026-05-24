import { describe, expect, it } from 'vitest';
import { criarContextoLinhaQuente } from '@/adapters/bots/contextoLinhaQuente';
import { escolherEmpate, escolherPressao, escolherTravessia, podeBifurcar } from '@/adapters/bots/regras-linha-quente';
import type { Carta } from '@/core/Carta';
import type { EstadoEmJogo, MesaItem } from '@/types/estado-rodada';
import { criarCarta, criarJogador } from '../core/rodada-fixtures';

describe('podeBifurcar', () => {
  it('deve recusar quando não há necessidade', () => {
    const estado = criarEstado({ mesa: mesaComBaixa(), declaracoes: { j2: 1, bot: 1 }, vazas: { j2: 1, bot: 1 } });
    const contexto = criarContextoLinhaQuente(estado, [criarCarta('A', '♦'), criarCarta('3', '♦')]);

    expect(podeBifurcar(estado, contexto, 8)).toEqual({ pode: false, motivoRecusa: 'sem necessidade' });
  });

  it('deve recusar quando não há vencedoras', () => {
    const estado = criarEstado({
      mesa: mesaComK(),
      declaracoes: { j1: 1, bot: 2 },
      vazas: { j1: 0, bot: 0 },
    });
    const contexto = criarContextoLinhaQuente(estado, [criarCarta('4', '♦'), criarCarta('6', '♦')]);

    expect(podeBifurcar(estado, contexto, 8)).toEqual({ pode: false, motivoRecusa: 'sem vencedoras' });
  });

  it('deve permitir bifurcação quando todas as condições passam', () => {
    const estado = criarEstado(cenarioBifurcacao());
    const contexto = criarContextoLinhaQuente(estado, [criarCarta('3', '♦'), criarCarta('4', '♦')]);

    expect(podeBifurcar(estado, contexto, 8)).toEqual({ pode: true });
  });
});

describe('escolherEmpate', () => {
  it('deve retornar carta e motivo quando já cumpriu e líder é alta+', () => {
    const estado = criarEstado({ mesa: mesaComDois(), declaracoes: { j1: 1, bot: 1 }, vazas: { j1: 0, bot: 1 } });
    const contexto = criarContextoLinhaQuente(estado, [criarCarta('2', '♦'), criarCarta('4', '♦')]);

    const decisao = escolherEmpate(contexto, 11);
    expect(decisao?.carta).toEqual(criarCarta('2', '♦'));
    expect(decisao?.motivo).toBe('empate com líder alta+');
  });
});

describe('escolherTravessia', () => {
  it('deve retornar carta e motivo quando precisa com folga baixa', () => {
    const estado = criarEstado({
      mesa: [{ jogadorId: 'j1', carta: criarCarta('K', '♣') }],
      declaracoes: { j1: 1, bot: 1 },
      vazas: { j1: 0, bot: 0 },
    });
    const contexto = criarContextoLinhaQuente(estado, [criarCarta('A', '♦'), criarCarta('3', '♦')]);

    const decisao = escolherTravessia(estado, contexto);
    expect(decisao?.carta).toEqual(criarCarta('A', '♦'));
    expect(decisao?.motivo).toBe('travessia: líder alta+ e urgência baixa');
  });
});

describe('escolherPressao', () => {
  it('deve preferir fuga mais cara quando há cartas de fuga', () => {
    const estado = criarEstado(cenarioBifurcacao());
    const contexto = criarContextoLinhaQuente(estado, [criarCarta('3', '♦'), criarCarta('4', '♦')]);

    expect(escolherPressao(contexto).motivo).toBe('pressão: fuga mais cara');
  });
});

function criarEstado(config: Partial<EstadoEmJogo>): EstadoEmJogo {
  const jogadores = [
    criarJogador('j1', 'J1'),
    criarJogador('j2', 'J2'),
    criarJogador('j3', 'J3'),
    criarJogador('bot', 'Bot'),
  ];
  return {
    fase: 'aguardandoJogada',
    jogadorAtual: 3,
    pontos: {},
    maos: jogadores.map((jogador) => ({ jogador, cartas: [], visivel: true })),
    cartasPorRodada: 3,
    manilha: '5',
    cartaVirada: null,
    declaracoes: {},
    mesa: [],
    cartasReveladas: [],
    vazas: {},
    turno: 1,
    ...config,
  };
}

function cenarioBifurcacao(): Partial<EstadoEmJogo> {
  return {
    mesa: [
      { jogadorId: 'j1', carta: criarCarta('4', '♣') },
      { jogadorId: 'j2', carta: criarCarta('4', '♥') },
      { jogadorId: 'j3', carta: criarCarta('4', '♠') },
    ],
    declaracoes: { j1: 0, j2: 1, bot: 1 },
    vazas: { j1: 0, j2: 0, bot: 0 },
    cartasReveladas: cartasQueGarantemTresDeOuros(),
  };
}

function mesaComBaixa(): MesaItem[] {
  return [
    { jogadorId: 'j1', carta: criarCarta('8', '♣') },
    { jogadorId: 'j2', carta: criarCarta('4', '♥') },
    { jogadorId: 'j3', carta: criarCarta('6', '♠') },
  ];
}

function mesaComDois(): MesaItem[] {
  return [
    { jogadorId: 'j1', carta: criarCarta('2', '♣') },
    { jogadorId: 'j2', carta: criarCarta('7', '♥') },
    { jogadorId: 'j3', carta: criarCarta('8', '♠') },
  ];
}

function mesaComK(): MesaItem[] {
  return [
    { jogadorId: 'j1', carta: criarCarta('K', '♣') },
    { jogadorId: 'j2', carta: criarCarta('7', '♥') },
    { jogadorId: 'j3', carta: criarCarta('8', '♠') },
  ];
}

function cartasQueGarantemTresDeOuros(): Carta[] {
  return [
    criarCarta('3', '♣'),
    criarCarta('3', '♥'),
    criarCarta('3', '♠'),
    criarCarta('5', '♣'),
    criarCarta('5', '♥'),
    criarCarta('5', '♠'),
    criarCarta('5', '♦'),
  ];
}
