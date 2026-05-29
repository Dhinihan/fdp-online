import { describe, expect, it } from 'vitest';
import { criarContextoLinhaQuente } from '@/adapters/bots/contextoLinhaQuente';
import { existeGarantidaParaDepois } from '@/adapters/bots/garantida-para-depois';
import { escolherVencedoraSegura, podeTentarComVencedoraSegura } from '@/adapters/bots/pode-vencedora-segura';
import { criarCarta } from '../core/rodada-fixtures';
import {
  cenarioRecusaVencedoraSegura,
  cenarioVencedoraSegura,
  cartasReveladasGarantidaTres,
  criarEstadoVencedoraSegura,
  maoVencedoraSegura,
} from './fixtures-vencedora-segura';

describe('existeGarantidaParaDepois', () => {
  it('deve detectar garantida_agora na mão', () => {
    const estado = criarEstadoVencedoraSegura({
      manilha: '8',
      cartasReveladas: cartasReveladasGarantidaTres(),
    });
    const contexto = criarContextoLinhaQuente(estado, [criarCarta('3', '♦'), criarCarta('7', '♦')]);

    expect(existeGarantidaParaDepois(contexto)).toBe(true);
  });

  it('deve retornar false sem garantida_agora na mão', () => {
    const estado = criarEstadoVencedoraSegura({ cartasReveladas: [] });
    const contexto = criarContextoLinhaQuente(estado, maoVencedoraSegura());

    expect(existeGarantidaParaDepois(contexto)).toBe(false);
  });
});

describe('podeTentarComVencedoraSegura recusa', () => {
  it.each(cenarioRecusaVencedoraSegura)('deve recusar quando $nome', ({ estado, mao }) => {
    expect(podeTentarComVencedoraSegura(estado, criarContextoLinhaQuente(estado, mao))).toBe(false);
  });
});

describe('podeTentarComVencedoraSegura permite', () => {
  it('deve permitir quando todos os critérios passam', () => {
    const estado = cenarioVencedoraSegura();
    const contexto = criarContextoLinhaQuente(estado, maoVencedoraSegura());

    expect(podeTentarComVencedoraSegura(estado, contexto)).toBe(true);
    expect(escolherVencedoraSegura(estado, contexto)).toEqual({
      carta: criarCarta('3', '♦'),
      motivo: 'vencedora segura: líder alta+ precisa, sem garantida para depois',
    });
  });
});
