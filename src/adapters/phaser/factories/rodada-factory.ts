import { DecisorDeclaracaoBot } from '@/adapters/bots/DecisorDeclaracaoBot';
import { DecisorJogadaBot } from '@/adapters/bots/DecisorJogadaBot';
import { aplicarPerfisBots, sortearPerfisBots } from '@/adapters/bots/perfil-bot';
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
  jogadores: Jogador[],
  rng: GeradorAleatorio,
): {
  jogada: Map<string, DecisorJogada>;
  declaracao: Map<string, DecisorDeclaracao>;
} {
  const jogada = new Map<string, DecisorJogada>([['humano', decisoresHumanos.jogada]]);
  const declaracao = new Map<string, DecisorDeclaracao>([['humano', decisoresHumanos.declaracao]]);
  jogadores.forEach((jogador) => {
    if (!jogador.id.startsWith('bot') || jogador.temperatura === undefined) return;
    jogada.set(jogador.id, new DecisorJogadaBot({ temperatura: jogador.temperatura, rng }));
    declaracao.set(jogador.id, new DecisorDeclaracaoBot(jogador.temperatura, rng));
  });
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
  const jogadoresComBots = aplicarPerfisBots(jogadores, sortearPerfisBots(jogadores, rng));
  const decisores = criarDecisores(decisoresHumanos, jogadoresComBots, rng);
  return new Partida(jogadoresComBots, emissor, { ...decisores, rng });
}
