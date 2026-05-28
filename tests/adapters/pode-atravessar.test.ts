import { describe, expect, it } from 'vitest';
import { criarContextoLinhaQuente } from '@/adapters/bots/contextoLinhaQuente';
import { decidirNaoUltimoLinhaFria } from '@/adapters/bots/DecisorJogadaLinhaFria';
import { DecisorJogadaLinhaQuente } from '@/adapters/bots/DecisorJogadaLinhaQuente';
import type { DecisaoJogadaDebug, LoggerDebugBot } from '@/adapters/bots/logger-debug-bot';
import { podeAtravessar, escolherTravessia } from '@/adapters/bots/pode-atravessar';
import { criarCarta } from '../core/rodada-fixtures';
import { criarEstadoAtravessia, cenariosRecusaAtravessia, maoAtravessia } from './fixtures-atravessia';

describe('podeAtravessar recusa', () => {
  it.each(cenariosRecusaAtravessia)('deve recusar quando $nome', ({ estado, mao }) => {
    const contexto = criarContextoLinhaQuente(estado, mao);
    expect(podeAtravessar(estado, contexto)).toBe(false);
  });
});

describe('podeAtravessar permite', () => {
  it('deve permitir quando todos os critérios passam', () => {
    const estado = criarEstadoAtravessia();
    const contexto = criarContextoLinhaQuente(estado, maoAtravessia());

    expect(podeAtravessar(estado, contexto)).toBe(true);
    expect(escolherTravessia(estado, contexto)).toEqual({
      carta: criarCarta('4', '♦'),
      motivo: 'atravessa: urgência 1.00, líder alta+ precisa, vencedora mais barata sem garantida',
    });
  });
});

describe('escolherTravessia na linha fria', () => {
  it('deve divergir da linha fria preservando garantida_agora', () => {
    const estado = criarEstadoAtravessia();
    const mao = maoAtravessia();

    expect(escolherTravessia(estado, criarContextoLinhaQuente(estado, mao))?.carta).toEqual(criarCarta('4', '♦'));
    expect(decidirNaoUltimoLinhaFria(mao, estado).carta).toEqual(criarCarta('3', '♦'));
  });
});

describe('DecisorJogadaLinhaQuente atravessia', () => {
  it('deve atravessar com vencedora mais barata sem garantida', atravessaComCartaBarata);
  it('deve registrar rastro de atravessia com critérios relevantes', registraRastroAtravessia);
});

async function atravessaComCartaBarata(): Promise<void> {
  const bot = criarBot(1, 0);
  await expect(bot.decidirJogada(maoAtravessia(), criarEstadoAtravessia())).resolves.toEqual(criarCarta('4', '♦'));
}

async function registraRastroAtravessia(): Promise<void> {
  const jogadas: DecisaoJogadaDebug[] = [];
  const bot = criarBot(1, 0, {
    registrarDeclaracao: () => undefined,
    registrarJogada: (jogada) => jogadas.push(jogada),
  });

  await bot.decidirJogada(maoAtravessia(), criarEstadoAtravessia());

  expect(jogadas[0]?.quente?.caminho).toEqual(['jogada', 'joga no meio', 'linha quente', 'atravessa']);
  expect(jogadas[0]?.quente?.motivo).toContain('atravessa: urgência 1.00');
}

function criarBot(temperatura: number, valorRng: number, logger?: LoggerDebugBot): DecisorJogadaLinhaQuente {
  return new DecisorJogadaLinhaQuente({
    temperatura,
    rng: { random: () => valorRng },
    logger,
  });
}
