import { DecisorDeclaracaoBot } from '@/adapters/bots/DecisorDeclaracaoBot';
import { DecisorJogadaLinhaFria } from '@/adapters/bots/DecisorJogadaLinhaFria';
import { DecisorJogadaLinhaQuente } from '@/adapters/bots/DecisorJogadaLinhaQuente';
import { Partida } from '@/core/Partida';
import type { DecisorDeclaracao } from '@/core/portas/DecisorDeclaracao';
import type { DecisorJogada } from '@/core/portas/DecisorJogada';
import { RngComSeed, type GeradorAleatorio } from '@/core/RngComSeed';
import { createEmissorEventos } from '@/store/emissor-eventos';
import type { Jogador } from '@/types/entidades';
import { subscreverEventos, type CallbacksRodada } from './subscricao-eventos-rodada';

export type { CallbacksRodada } from './subscricao-eventos-rodada';

function criarDecisores(
  decisoresHumanos: { jogada: DecisorJogada; declaracao: DecisorDeclaracao },
  rng: GeradorAleatorio,
): {
  jogada: Map<string, DecisorJogada>;
  declaracao: Map<string, DecisorDeclaracao>;
} {
  const jogada = new Map<string, DecisorJogada>([
    ['humano', decisoresHumanos.jogada],
    ['bot1', new DecisorJogadaLinhaFria()],
    ['bot2', new DecisorJogadaLinhaQuente({ temperatura: 0.55, rng })],
    ['bot3', new DecisorJogadaLinhaQuente({ temperatura: 0.9, rng })],
  ]);
  const declaracao = new Map<string, DecisorDeclaracao>([
    ['humano', decisoresHumanos.declaracao],
    ['bot1', new DecisorDeclaracaoBot(0.2, rng)],
    ['bot2', new DecisorDeclaracaoBot(0.5, rng)],
    ['bot3', new DecisorDeclaracaoBot(0.8, rng)],
  ]);
  return { jogada, declaracao };
}

export function fabricarPartida(
  jogadores: Jogador[],
  decisoresHumanos: { jogada: DecisorJogada; declaracao: DecisorDeclaracao },
  callbacks: CallbacksRodada,
): Partida {
  const emissor = createEmissorEventos();
  subscreverEventos(emissor, callbacks);
  const rng = new RngComSeed(Date.now());
  const decisores = criarDecisores(decisoresHumanos, rng);
  return new Partida(jogadores, emissor, { ...decisores, rng });
}
