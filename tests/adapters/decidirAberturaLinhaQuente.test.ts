import { describe, expect, it } from 'vitest';
import {
  decidirAberturaLinhaFria,
  decidirAberturaLinhaQuente,
  MOTIVO_ABERTURA_LINHA_QUENTE,
} from '@/adapters/bots/decidirAbertura';
import { criarCarta } from '../core/rodada-fixtures';
import { criarEstadoLinhaFria } from './fixtures-linha-fria';

describe('decidirAberturaLinhaQuente', () => {
  it('deve espelhar carta, motivo e caminho da decisão fria', () => {
    const mao = [criarCarta('7', '♦'), criarCarta('2', '♦'), criarCarta('8', '♦')];
    const estado = criarEstadoLinhaFria({ mesa: [], declaracoes: { bot: 2 }, vazas: { bot: 0 } });
    const fria = decidirAberturaLinhaFria(mao, estado);
    const quente = decidirAberturaLinhaQuente(fria);

    expect(quente.carta).toEqual(fria.carta);
    expect(quente.motivo).toBe(MOTIVO_ABERTURA_LINHA_QUENTE);
    expect(quente.caminho).toEqual(['jogada', 'abre a mesa', 'linha quente', 'segue linha fria']);
  });
});
