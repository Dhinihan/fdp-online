import { describe, expect, it } from 'vitest';
import { decidirUltimoLinhaQuente } from '@/adapters/bots/decidirUltimoLinhaQuente';
import { lerMesa } from '@/adapters/bots/ler-mesa';
import type { Carta } from '@/core/Carta';
import type { EstadoEmJogo, MesaItem } from '@/types/estado-rodada';
import { criarCarta, criarJogador } from '../core/rodada-fixtures';

const cenarios: {
  nome: string;
  mao: Carta[];
  estado: EstadoEmJogo;
  esperado: { carta: Carta; motivo: string };
}[] = [
  {
    nome: 'deve retornar G[N-X] quando precisa fazer e tem vencedoras',
    mao: [criarCarta('5', '♦'), criarCarta('8', '♦'), criarCarta('K', '♦')],
    estado: criarEstado({ mesa: mesaComQuatro(), declaracoes: { bot: 2 }, vazas: { bot: 0 }, manilha: '6' }),
    esperado: { carta: criarCarta('8', '♦'), motivo: 'precisa fazer; regra G[N-X]' },
  },
  {
    nome: 'deve retornar P[N-X] quando precisa fazer sem carta que vence',
    mao: [criarCarta('4', '♦'), criarCarta('6', '♦'), criarCarta('9', '♦'), criarCarta('Q', '♦')],
    estado: criarEstado({ mesa: mesaComK(), declaracoes: { bot: 2 }, vazas: { bot: 0 }, manilha: '5' }),
    esperado: { carta: criarCarta('9', '♦'), motivo: 'precisa fazer, sem carta que vence; P[N-X]' },
  },
  {
    nome: 'deve adiar com P[N-X] quando líder é média e urgência é baixa',
    mao: [criarCarta('6', '♦'), criarCarta('Q', '♦'), criarCarta('A', '♦')],
    estado: criarEstado({ mesa: mesaComNove(), declaracoes: { j1: 1, bot: 1 }, vazas: { j1: 0, bot: 0 } }),
    esperado: { carta: criarCarta('6', '♦'), motivo: 'precisa fazer; adiou; P[N-X]' },
  },
  {
    nome: 'deve usar P[N-X] e não a perdedora mais forte quando adia com necessidade 2',
    mao: [criarCarta('4', '♦'), criarCarta('6', '♦'), criarCarta('7', '♦'), criarCarta('Q', '♦')],
    estado: criarEstado({ mesa: mesaComNove(), declaracoes: { j1: 1, bot: 2 }, vazas: { j1: 0, bot: 0 } }),
    esperado: { carta: criarCarta('6', '♦'), motivo: 'precisa fazer; adiou; P[N-X]' },
  },
  {
    nome: 'deve fugir com carta mais alta que não faz quando já cumpriu',
    mao: [criarCarta('K', '♦'), criarCarta('A', '♦')],
    estado: criarEstado({
      mesa: [{ jogadorId: 'j1', carta: criarCarta('K', '♣') }],
      declaracoes: { bot: 1 },
      vazas: { bot: 1 },
    }),
    esperado: { carta: criarCarta('K', '♦'), motivo: 'já cumpriu; carta mais alta que não faz' },
  },
  {
    nome: 'deve fugir contra líder alta+ com empate quando já cumpriu',
    mao: [criarCarta('2', '♦'), criarCarta('3', '♦')],
    estado: criarEstado({ mesa: mesaComDois(), declaracoes: { j1: 1, bot: 1 }, vazas: { j1: 0, bot: 1 } }),
    esperado: { carta: criarCarta('2', '♦'), motivo: 'já cumpriu; fuga contra líder alta+' },
  },
  {
    nome: 'deve jogar a mais forte quando fuga é impossível',
    mao: [criarCarta('Q', '♦'), criarCarta('A', '♦')],
    estado: criarEstado({ mesa: mesaComNove(), declaracoes: { j1: 0, bot: 1 }, vazas: { j1: 0, bot: 1 } }),
    esperado: { carta: criarCarta('A', '♦'), motivo: 'já cumpriu; fuga impossível' },
  },
];

describe('decidirUltimoLinhaQuente', () => {
  it.each(cenarios)('$nome', ({ mao, estado, esperado }) => {
    const leitura = lerMesa(estado, mao);
    expect(decidirUltimoLinhaQuente(estado, leitura)).toEqual(esperado);
  });
});

function criarEstado(config: Partial<EstadoEmJogo>): EstadoEmJogo {
  const jogadores = ['j1', 'j2', 'j3', 'bot'].map((id) => criarJogador(id, id === 'bot' ? 'Bot' : id.toUpperCase()));
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

function mesaComK(): MesaItem[] {
  return [
    { jogadorId: 'j1', carta: criarCarta('K', '♣') },
    { jogadorId: 'j2', carta: criarCarta('7', '♥') },
    { jogadorId: 'j3', carta: criarCarta('8', '♠') },
  ];
}

function mesaComQuatro(): MesaItem[] {
  return [
    { jogadorId: 'j1', carta: criarCarta('4', '♣') },
    { jogadorId: 'j2', carta: criarCarta('4', '♥') },
    { jogadorId: 'j3', carta: criarCarta('4', '♠') },
  ];
}

function mesaComNove(): MesaItem[] {
  return [
    { jogadorId: 'j1', carta: criarCarta('9', '♣') },
    { jogadorId: 'j2', carta: criarCarta('6', '♥') },
    { jogadorId: 'j3', carta: criarCarta('7', '♠') },
  ];
}

function mesaComDois(): MesaItem[] {
  return [
    { jogadorId: 'j1', carta: criarCarta('2', '♣') },
    { jogadorId: 'j2', carta: criarCarta('7', '♥') },
    { jogadorId: 'j3', carta: criarCarta('8', '♠') },
  ];
}
