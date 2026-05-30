import { describe, expect, it } from 'vitest';
import { criarCaminhoJogadaDebug } from '@/adapters/bots/debug-jogada-bot';
import { decidirLinhaQuente } from '@/adapters/bots/decidir-linha-quente';
import { decidirAberturaLinhaFria, MOTIVO_ABERTURA_LINHA_QUENTE } from '@/adapters/bots/decidirAbertura';
import { lerMesa } from '@/adapters/bots/ler-mesa';
import { criarCarta } from '../core/rodada-fixtures';
import { criarEstadoLinhaFria } from './fixtures-linha-fria';

describe('decidirLinhaQuente na abertura', () => {
  it('deve espelhar carta fria com motivo e caminho de seguir linha fria', () => {
    const mao = [criarCarta('7', '♦'), criarCarta('2', '♦'), criarCarta('8', '♦')];
    const estado = criarEstadoLinhaFria({ mesa: [], declaracoes: { bot: 2 }, vazas: { bot: 0 } });
    const leitura = lerMesa(estado, mao);
    const fria = decidirAberturaLinhaFria(leitura);
    const quente = decidirLinhaQuente({ posicao: 'abre', estado, leitura, liderBaixa: 8 });

    expect(quente).toEqual({ tipo: 'segue-fria', motivo: MOTIVO_ABERTURA_LINHA_QUENTE });
    expect(fria.carta).toEqual(criarCarta('2', '♦'));
    expect(criarCaminhoJogadaDebug('abre', 'quente', 'segue linha fria')).toEqual([
      'jogada',
      'abre a mesa',
      'linha quente',
      'segue linha fria',
    ]);
  });
});
