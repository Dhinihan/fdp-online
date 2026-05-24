import { describe, expect, it } from 'vitest';
import { decidirNaoUltimoLinhaFria } from '@/adapters/bots/DecisorJogadaLinhaFria';
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
    nome: 'deve abrir com motivo de sem referência na mesa',
    mao: [criarCarta('3', '♦'), criarCarta('8', '♦')],
    estado: criarEstado({
      mesa: [],
      declaracoes: { bot: 0 },
      vazas: { bot: 0 },
      cartasReveladas: cartasQueGarantemTresDeOuros(),
    }),
    esperado: { carta: criarCarta('8', '♦'), motivo: 'abertura: sem referência na mesa' },
  },
  {
    nome: 'deve fugir com carta mais alta que não faz',
    mao: [criarCarta('Q', '♦'), criarCarta('K', '♦')],
    estado: criarEstado({ mesa: mesaComK(), declaracoes: { bot: 1 }, vazas: { bot: 1 }, manilha: '5' }),
    esperado: { carta: criarCarta('K', '♦'), motivo: 'não quer fazer; carta mais alta que não faz' },
  },
  {
    nome: 'deve indicar fuga impossível quando todas fazem',
    mao: [criarCarta('5', '♦'), criarCarta('8', '♦'), criarCarta('K', '♦')],
    estado: criarEstado({ mesa: mesaComQuatro(), declaracoes: { bot: 1 }, vazas: { bot: 1 }, manilha: '6' }),
    esperado: { carta: criarCarta('5', '♦'), motivo: 'não quer fazer; fuga impossível' },
  },
  {
    nome: 'deve buscar vaza com G[N-X] quando precisa fazer e tem vencedoras',
    mao: [criarCarta('5', '♦'), criarCarta('8', '♦'), criarCarta('K', '♦')],
    estado: criarEstado({ mesa: mesaComQuatro(), declaracoes: { bot: 2 }, vazas: { bot: 0 }, manilha: '6' }),
    esperado: { carta: criarCarta('8', '♦'), motivo: 'precisa fazer; regra G[N-X]' },
  },
  {
    nome: 'deve buscar vaza com P[N-X] quando precisa fazer sem vencedoras',
    mao: [criarCarta('4', '♦'), criarCarta('6', '♦'), criarCarta('9', '♦'), criarCarta('Q', '♦')],
    estado: criarEstado({ mesa: mesaComK(), declaracoes: { bot: 2 }, vazas: { bot: 0 }, manilha: '5' }),
    esperado: { carta: criarCarta('9', '♦'), motivo: 'precisa fazer; regra P[N-X]' },
  },
];

describe('decidirNaoUltimoLinhaFria', () => {
  it.each(cenarios)('$nome', ({ mao, estado, esperado }) => {
    expect(decidirNaoUltimoLinhaFria(mao, estado)).toEqual(esperado);
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

function cartasQueGarantemTresDeOuros(): Carta[] {
  return [
    criarCarta('3', '♣'),
    criarCarta('3', '♥'),
    criarCarta('3', '♠'),
    criarCarta('4', '♣'),
    criarCarta('4', '♥'),
    criarCarta('4', '♠'),
    criarCarta('4', '♦'),
  ];
}
