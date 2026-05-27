import { describe, expect, it } from 'vitest';
import { decidirNaoUltimoLinhaFria } from '@/adapters/bots/DecisorJogadaLinhaFria';
import type { Carta } from '@/core/Carta';
import type { EstadoEmJogo } from '@/types/estado-rodada';
import { criarCarta } from '../core/rodada-fixtures';
import {
  CAMINHO_GUARDA_PERMITIU,
  cartasQueGarantemTresDeOuros,
  criarEstadoLinhaFria,
  mesaComK,
  mesaComQuatro,
} from './fixtures-linha-fria';

const cenarios: {
  nome: string;
  mao: Carta[];
  estado: EstadoEmJogo;
  esperado: { carta: Carta; motivo: string; caminho?: string[] };
}[] = [
  {
    nome: 'deve abrir com ordem cautelosa quando já cumpriu',
    mao: [criarCarta('7', '♦'), criarCarta('8', '♦'), criarCarta('3', '♦')],
    estado: criarEstadoLinhaFria({
      mesa: [],
      declaracoes: { bot: 0 },
      vazas: { bot: 0 },
      cartasReveladas: cartasQueGarantemTresDeOuros(),
    }),
    esperado: {
      carta: criarCarta('7', '♦'),
      motivo: 'abertura: já cumpriu; ordem baixa-média-alta-segura-garantida_agora',
      caminho: ['jogada', 'abre a mesa', 'linha fria', 'já cumpriu'],
    },
  },
  {
    nome: 'deve abrir cautelosamente quando precisa fazer sem urgência alta',
    mao: [criarCarta('7', '♦'), criarCarta('3', '♦')],
    estado: criarEstadoLinhaFria({ mesa: [], declaracoes: { bot: 1 }, vazas: { bot: 0 } }),
    esperado: {
      carta: criarCarta('7', '♦'),
      motivo: 'abertura: precisa sem urgência alta; ordem baixa-média-alta-segura-garantida_agora',
      caminho: ['jogada', 'abre a mesa', 'linha fria', 'precisa sem urgência alta'],
    },
  },
  {
    nome: 'deve abrir forte quando precisa fazer com urgência alta',
    mao: [criarCarta('7', '♦'), criarCarta('2', '♦'), criarCarta('8', '♦')],
    estado: criarEstadoLinhaFria({ mesa: [], declaracoes: { bot: 2 }, vazas: { bot: 0 } }),
    esperado: {
      carta: criarCarta('2', '♦'),
      motivo: 'abertura: urgência alta; ordem alta-média-segura-baixa-garantida_agora',
      caminho: ['jogada', 'abre a mesa', 'linha fria', 'urgência alta'],
    },
  },
  {
    nome: 'deve fugir com carta mais alta que não faz',
    mao: [criarCarta('Q', '♦'), criarCarta('K', '♦')],
    estado: criarEstadoLinhaFria({ mesa: mesaComK(), declaracoes: { bot: 1 }, vazas: { bot: 1 }, manilha: '5' }),
    esperado: { carta: criarCarta('K', '♦'), motivo: 'não quer fazer; carta mais alta que não faz' },
  },
  {
    nome: 'deve indicar fuga impossível quando todas fazem',
    mao: [criarCarta('5', '♦'), criarCarta('8', '♦'), criarCarta('K', '♦')],
    estado: criarEstadoLinhaFria({ mesa: mesaComQuatro(), declaracoes: { bot: 1 }, vazas: { bot: 1 }, manilha: '6' }),
    esperado: { carta: criarCarta('5', '♦'), motivo: 'não quer fazer; fuga impossível' },
  },
  {
    nome: 'deve buscar vaza com G[N-X] quando precisa fazer e tem vencedoras',
    mao: [criarCarta('5', '♦'), criarCarta('8', '♦'), criarCarta('K', '♦')],
    estado: criarEstadoLinhaFria({ mesa: mesaComQuatro(), declaracoes: { bot: 2 }, vazas: { bot: 0 }, manilha: '6' }),
    esperado: {
      carta: criarCarta('8', '♦'),
      motivo: 'guarda de posição permitiu; urgência alta; precisa fazer; regra G[N-X]',
      caminho: [...CAMINHO_GUARDA_PERMITIU],
    },
  },
  {
    nome: 'deve buscar vaza com P[N-X] quando precisa fazer sem vencedoras',
    mao: [criarCarta('4', '♦'), criarCarta('6', '♦'), criarCarta('9', '♦'), criarCarta('Q', '♦')],
    estado: criarEstadoLinhaFria({ mesa: mesaComK(), declaracoes: { bot: 2 }, vazas: { bot: 0 }, manilha: '5' }),
    esperado: {
      carta: criarCarta('9', '♦'),
      motivo: 'guarda de posição permitiu; jogadores por agir já cumpriram; precisa fazer; regra P[N-X]',
      caminho: [...CAMINHO_GUARDA_PERMITIU],
    },
  },
];

describe('decidirNaoUltimoLinhaFria', () => {
  it.each(cenarios)('$nome', ({ mao, estado, esperado }) => {
    expect(decidirNaoUltimoLinhaFria(mao, estado)).toEqual(esperado);
  });
});
