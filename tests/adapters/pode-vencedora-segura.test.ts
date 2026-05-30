import { describe, expect, it } from 'vitest';
import { existeGarantidaParaDepois } from '@/adapters/bots/garantida-para-depois';
import { lerMesa } from '@/adapters/bots/ler-mesa';
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
    const leitura = lerMesa(estado, [criarCarta('3', '♦'), criarCarta('7', '♦')]);

    expect(existeGarantidaParaDepois(leitura)).toBe(true);
  });

  it('deve retornar false sem garantida_agora na mão', () => {
    const estado = criarEstadoVencedoraSegura({ cartasReveladas: [] });
    const leitura = lerMesa(estado, maoVencedoraSegura());

    expect(existeGarantidaParaDepois(leitura)).toBe(false);
  });
});

describe('podeTentarComVencedoraSegura recusa', () => {
  it.each(cenarioRecusaVencedoraSegura)('deve recusar quando $nome', ({ estado, mao }) => {
    expect(podeTentarComVencedoraSegura(lerMesa(estado, mao))).toBe(false);
  });
});

describe('podeTentarComVencedoraSegura permite', () => {
  it('deve permitir quando todos os critérios passam', () => {
    const estado = cenarioVencedoraSegura();
    const leitura = lerMesa(estado, maoVencedoraSegura());

    expect(podeTentarComVencedoraSegura(leitura)).toBe(true);
    expect(escolherVencedoraSegura(leitura)).toEqual({
      carta: criarCarta('3', '♦'),
      motivo: 'vencedora segura: líder alta+ precisa, sem garantida para depois',
    });
  });
});
