import { describe, expect, it } from 'vitest';
import { criarContextoLinhaQuente } from '@/adapters/bots/contextoLinhaQuente';
import {
  escolherJaCumpriuNoMeio,
  escolherPressao,
  escolherTravessia,
  podeBifurcar,
} from '@/adapters/bots/regras-linha-quente';
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

const cenariosJaCumpriuNoMeio: {
  nome: string;
  estado: Partial<EstadoEmJogo>;
  mao: Carta[];
  esperado: { carta: Carta; motivo: string } | null;
}[] = [
  {
    nome: 'empatar contra líder interessado alta+',
    estado: {
      mesa: [
        { jogadorId: 'j1', carta: criarCarta('2', '♣') },
        { jogadorId: 'j2', carta: criarCarta('7', '♥') },
      ],
      declaracoes: { j1: 1, bot: 1 },
      vazas: { j1: 0, bot: 1 },
    },
    mao: [criarCarta('2', '♦'), criarCarta('4', '♦')],
    esperado: { carta: criarCarta('2', '♦'), motivo: 'já cumpriu; empate contra líder alta+' },
  },
  {
    nome: 'preferir perdedora com líder média',
    estado: {
      mesa: [
        { jogadorId: 'j1', carta: criarCarta('9', '♣') },
        { jogadorId: 'j2', carta: criarCarta('6', '♥') },
      ],
      declaracoes: { j1: 1, bot: 1 },
      vazas: { j1: 0, bot: 1 },
    },
    mao: [criarCarta('9', '♦'), criarCarta('7', '♦')],
    esperado: { carta: criarCarta('7', '♦'), motivo: 'já cumpriu; perdedora mais forte' },
  },
  {
    nome: 'retornar null sem carta que não faz',
    estado: {
      mesa: [
        { jogadorId: 'j1', carta: criarCarta('4', '♣') },
        { jogadorId: 'j2', carta: criarCarta('4', '♥') },
      ],
      declaracoes: { bot: 1 },
      vazas: { bot: 1 },
      manilha: '6',
    },
    mao: [criarCarta('5', '♦'), criarCarta('8', '♦'), criarCarta('K', '♦')],
    esperado: null,
  },
  {
    nome: 'retornar null quando ainda precisa cumprir mesmo com folga alta',
    estado: {
      mesa: [{ jogadorId: 'j1', carta: criarCarta('2', '♣') }],
      declaracoes: { j1: 2, bot: 2 },
      vazas: { j1: 0, bot: 0 },
    },
    mao: [criarCarta('2', '♦'), criarCarta('4', '♦'), criarCarta('6', '♦'), criarCarta('8', '♦')],
    esperado: null,
  },
];

describe('escolherJaCumpriuNoMeio', () => {
  it.each(cenariosJaCumpriuNoMeio)('deve $nome', ({ estado: config, mao, esperado }) => {
    const estado = criarEstado(config);
    const contexto = criarContextoLinhaQuente(estado, mao);
    expect(escolherJaCumpriuNoMeio(estado, contexto)).toEqual(esperado);
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
