import { describe, expect, it } from 'vitest';
import type { DecisaoJogadaDebug } from '@/adapters/bots/logger-debug-bot';
import { criarCarta } from '../core/rodada-fixtures';
import { cenarioEsperaOportunidade, maoEsperaOportunidade } from './fixtures-espera-oportunidade';
import { criarBotLinhaQuente, criarEstado } from './fixtures-jogada-linha-quente';
import { cenarioVencedoraSegura, maoVencedoraSegura } from './fixtures-vencedora-segura';

describe('DecisorJogadaLinhaQuente no meio', () => {
  it('deve escolher vencedora segura quando pressão não casa', escolheVencedoraSegura);
  it('deve esperar oportunidade quando pressão e vencedora segura falham', esperaOportunidade);
  it('deve descer para espera quando há garantida mas pressão falha', pressaoFalhaDesceParaEspera);
});

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
