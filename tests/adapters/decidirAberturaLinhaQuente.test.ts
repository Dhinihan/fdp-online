import { describe, expect, it, vi } from 'vitest';
import {
  decidirAberturaLinhaFria,
  decidirAberturaLinhaQuente,
  MOTIVO_ABERTURA_LINHA_QUENTE,
} from '@/adapters/bots/decidirAbertura';
import { DecisorJogadaBot } from '@/adapters/bots/DecisorJogadaBot';
import type { DecisaoJogadaDebug } from '@/adapters/bots/logger-debug-bot';
import type { Carta } from '@/core/Carta';
import type { EstadoEmJogo } from '@/types/estado-rodada';
import { criarCarta } from '../core/rodada-fixtures';
import { cartasQueGarantemTresDeOuros, criarEstadoLinhaFria } from './fixtures-linha-fria';

const cenarios: {
  nome: string;
  mao: Carta[];
  estado: EstadoEmJogo;
}[] = [
  {
    nome: 'deve coincidir com a fria quando já cumpriu',
    mao: [criarCarta('7', '♦'), criarCarta('8', '♦'), criarCarta('3', '♦')],
    estado: criarEstadoLinhaFria({
      mesa: [],
      declaracoes: { bot: 0 },
      vazas: { bot: 0 },
      cartasReveladas: cartasQueGarantemTresDeOuros(),
    }),
  },
  {
    nome: 'deve coincidir com a fria quando precisa sem urgência alta',
    mao: [criarCarta('7', '♦'), criarCarta('3', '♦')],
    estado: criarEstadoLinhaFria({ mesa: [], declaracoes: { bot: 1 }, vazas: { bot: 0 } }),
  },
  {
    nome: 'deve coincidir com a fria quando urgência é alta',
    mao: [criarCarta('7', '♦'), criarCarta('2', '♦'), criarCarta('8', '♦')],
    estado: criarEstadoLinhaFria({ mesa: [], declaracoes: { bot: 2 }, vazas: { bot: 0 } }),
  },
];

describe('decidirAberturaLinhaQuente', () => {
  it.each(cenarios)('$nome', ({ mao, estado }) => {
    const fria = decidirAberturaLinhaFria(mao, estado);
    const quente = decidirAberturaLinhaQuente(fria);

    expect(quente.carta).toEqual(fria.carta);
    expect(quente.motivo).toBe(MOTIVO_ABERTURA_LINHA_QUENTE);
    expect(quente.caminho).toEqual(['jogada', 'abre a mesa', 'linha quente', 'segue linha fria']);
  });

  it('não deve sortear temperatura na abertura quando fria e quente coincidem', naoSorteiaTemperaturaNaAbertura);
});

async function naoSorteiaTemperaturaNaAbertura(): Promise<void> {
  const estado = criarEstadoLinhaFria({
    mesa: [],
    declaracoes: { bot: 2 },
    vazas: { bot: 0 },
    jogadorAtual: 3,
  });
  const rng = vi.fn(() => 0);
  const jogadas: DecisaoJogadaDebug[] = [];
  const bot = new DecisorJogadaBot({
    temperatura: 1,
    rng: { random: rng },
    logger: {
      registrarDeclaracao: () => undefined,
      registrarJogada: (jogada) => jogadas.push(jogada),
    },
  });

  await bot.decidirJogada([criarCarta('8', '♦'), criarCarta('2', '♠')], estado);

  expect(rng).not.toHaveBeenCalled();
  expect(jogadas[0]?.fria?.carta).toEqual(jogadas[0]?.quente?.carta);
  expect(jogadas[0]?.sorteio).toBeUndefined();
}
