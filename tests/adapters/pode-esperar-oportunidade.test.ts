import { describe, expect, it } from 'vitest';
import { decidirNaoUltimoLinhaFria } from '@/adapters/bots/DecisorJogadaLinhaFria';
import { lerMesa } from '@/adapters/bots/ler-mesa';
import { escolherEsperarOportunidade, podeEsperarOportunidade } from '@/adapters/bots/pode-esperar-oportunidade';
import { criarCarta } from '../core/rodada-fixtures';
import {
  cenarioEsperaOportunidade,
  cenarioRecusaEsperaOportunidade,
  maoEsperaOportunidade,
} from './fixtures-espera-oportunidade';

describe('podeEsperarOportunidade recusa', () => {
  it.each(cenarioRecusaEsperaOportunidade)('deve recusar quando $nome', ({ estado, mao }) => {
    expect(podeEsperarOportunidade(lerMesa(estado, mao))).toBe(false);
  });
});

describe('podeEsperarOportunidade permite', () => {
  it('deve permitir quando há carta que não faz a vaza', () => {
    const estado = cenarioEsperaOportunidade();
    const leitura = lerMesa(estado, maoEsperaOportunidade());

    expect(podeEsperarOportunidade(leitura)).toBe(true);
    expect(escolherEsperarOportunidade(estado, leitura)).toEqual({
      carta: criarCarta('7', '♦'),
      motivo: 'espera oportunidade: descarte por necessidade',
    });
  });
});

describe('escolherEsperarOportunidade na linha fria', () => {
  it('deve convergir com descarte por necessidade da linha fria', () => {
    const estado = cenarioEsperaOportunidade();
    const mao = maoEsperaOportunidade();

    expect(escolherEsperarOportunidade(estado, lerMesa(estado, mao))?.carta).toEqual(criarCarta('7', '♦'));
    expect(decidirNaoUltimoLinhaFria(lerMesa(estado, mao), estado).carta).toEqual(criarCarta('7', '♦'));
  });
});
