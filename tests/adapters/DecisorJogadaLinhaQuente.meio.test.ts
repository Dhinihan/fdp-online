import { describe, expect, it } from 'vitest';
import type { DecisaoJogadaDebug } from '@/adapters/bots/logger-debug-bot';
import type { EstadoEmJogo } from '@/types/estado-rodada';
import { criarCarta } from '../core/rodada-fixtures';
import { cenarioEsperaOportunidade, maoEsperaOportunidade } from './fixtures-espera-oportunidade';
import { criarBotLinhaQuente, criarEstado } from './fixtures-jogada-linha-quente';
import { cenarioVencedoraSegura, maoVencedoraSegura } from './fixtures-vencedora-segura';

describe('DecisorJogadaLinhaQuente no meio', () => {
  it('deve escolher vencedora segura quando pressão não casa', escolheVencedoraSegura);
  it('deve esperar oportunidade quando pressão e vencedora segura falham', esperaOportunidade);
  it('deve descer para espera quando há garantida mas pressão falha', pressaoFalhaDesceParaEspera);
  it('deve seguir fria com urgência alta e nenhum ramo aplicável mesmo havendo fuga', seguirFriaUrgenciaAlta);
});

function cenarioFallbackUrgenciaAlta(): Partial<EstadoEmJogo> {
  return {
    mesa: [{ jogadorId: 'j1', carta: criarCarta('9', '♣') }],
    declaracoes: { j1: 1, bot: 2 },
    vazas: { j1: 0, bot: 0 },
  };
}

async function escolheVencedoraSegura(): Promise<void> {
  const bot = criarBotLinhaQuente(1, 0);

  await expect(bot.decidirJogada(maoVencedoraSegura(), criarEstado(cenarioVencedoraSegura()))).resolves.toEqual(
    criarCarta('3', '♦'),
  );
}

async function esperaOportunidade(): Promise<void> {
  const estado = criarEstado(cenarioEsperaOportunidade());
  const bot = criarBotLinhaQuente(1, 0);

  await expect(bot.decidirJogada(maoEsperaOportunidade(), estado)).resolves.toEqual(criarCarta('7', '♦'));
}

async function pressaoFalhaDesceParaEspera(): Promise<void> {
  const estado = criarEstado(cenarioEsperaOportunidade());
  const jogadas: DecisaoJogadaDebug[] = [];
  const bot = criarBotLinhaQuente(1, 0, {
    registrarDeclaracao: () => undefined,
    registrarJogada: (jogada) => jogadas.push(jogada),
  });

  await bot.decidirJogada(maoEsperaOportunidade(), estado);

  expect(jogadas[0]?.quente?.caminho).toEqual(['jogada', 'joga no meio', 'linha quente', 'espera oportunidade']);
  expect(jogadas[0]?.quente?.motivo).toBe('espera oportunidade: descarte por necessidade');
}

async function seguirFriaUrgenciaAlta(): Promise<void> {
  const estado = criarEstado(cenarioFallbackUrgenciaAlta());
  const mao = [criarCarta('7', '♦'), criarCarta('K', '♦')];
  const jogadas: DecisaoJogadaDebug[] = [];
  const bot = criarBotLinhaQuente(1, 0, {
    registrarDeclaracao: () => undefined,
    registrarJogada: (jogada) => jogadas.push(jogada),
  });

  await expect(bot.decidirJogada(mao, estado)).resolves.toEqual(criarCarta('K', '♦'));

  expect(jogadas[0]?.quente?.caminho).toEqual(['jogada', 'joga no meio', 'linha quente', 'segue fria']);
  expect(jogadas[0]?.quente?.motivo).toBe('linha quente segue fria: nenhum ramo se aplica');
}
