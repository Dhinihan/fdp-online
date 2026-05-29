import { describe, expect, it } from 'vitest';
import { criarContextoLinhaQuente } from '@/adapters/bots/contextoLinhaQuente';
import { decidirNaoUltimoLinhaFria } from '@/adapters/bots/DecisorJogadaLinhaFria';
import { escolherEsperarOportunidade, podeEsperarOportunidade } from '@/adapters/bots/pode-esperar-oportunidade';
import { criarCarta } from '../core/rodada-fixtures';
import {
  cenarioEsperaOportunidade,
  cenarioRecusaEsperaOportunidade,
  maoEsperaOportunidade,
} from './fixtures-espera-oportunidade';

describe('podeEsperarOportunidade recusa', () => {
  it.each(cenarioRecusaEsperaOportunidade)('deve recusar quando $nome', ({ estado, mao }) => {
    expect(podeEsperarOportunidade(criarContextoLinhaQuente(estado, mao))).toBe(false);
  });
});

describe('podeEsperarOportunidade permite', () => {
  it('deve permitir quando há carta que não faz a vaza', () => {
    const estado = cenarioEsperaOportunidade();
    const contexto = criarContextoLinhaQuente(estado, maoEsperaOportunidade());

    expect(podeEsperarOportunidade(contexto)).toBe(true);
    expect(escolherEsperarOportunidade(estado, contexto)).toEqual({
      carta: criarCarta('7', '♦'),
      motivo: 'espera oportunidade: descarte por necessidade',
    });
  });
});

describe('escolherEsperarOportunidade na linha fria', () => {
  it('deve convergir com descarte por necessidade da linha fria', () => {
    const estado = cenarioEsperaOportunidade();
    const mao = maoEsperaOportunidade();

    expect(escolherEsperarOportunidade(estado, criarContextoLinhaQuente(estado, mao))?.carta).toEqual(
      criarCarta('7', '♦'),
    );
    expect(decidirNaoUltimoLinhaFria(mao, estado).carta).toEqual(criarCarta('7', '♦'));
  });
});
