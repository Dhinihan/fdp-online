import { DecisorDeclaracaoBot } from '@/adapters/bots/DecisorDeclaracaoBot';
import { DecisorJogadaPorTemperatura } from '@/adapters/bots/DecisorJogadaPorTemperatura';
import { criarLoggerDebugBot } from '@/adapters/bots/logger-debug-bot';
import { aplicarPerfisBots, sortearPerfisBots } from '@/adapters/bots/perfil-bot';
import { Partida } from '@/core/Partida';
import type { DecisorDeclaracao } from '@/core/portas/DecisorDeclaracao';
import type { DecisorJogada } from '@/core/portas/DecisorJogada';
import { RngComSeed, type GeradorAleatorio } from '@/core/RngComSeed';
import { createEmissorEventos } from '@/store/emissor-eventos';
import type { Jogador } from '@/types/entidades';
import { subscreverEventos, type CallbacksRodada } from './subscricao-eventos-rodada';

export type { CallbacksRodada } from './subscricao-eventos-rodada';

interface ConfigDecisores {
  humanos: { jogada: DecisorJogada; declaracao: DecisorDeclaracao };
  jogadores: Jogador[];
  rng: GeradorAleatorio;
  modoDebug: boolean;
}

interface CallbacksPartida extends CallbacksRodada {
  modoDebug?: boolean;
}

function criarDecisores(config: ConfigDecisores): {
  jogada: Map<string, DecisorJogada>;
  declaracao: Map<string, DecisorDeclaracao>;
} {
  const jogada = new Map<string, DecisorJogada>([['humano', config.humanos.jogada]]);
  const declaracao = new Map<string, DecisorDeclaracao>([['humano', config.humanos.declaracao]]);
  config.jogadores.forEach((jogador) => {
    if (!jogador.id.startsWith('bot') || jogador.temperatura === undefined) return;
    const logger = config.modoDebug ? criarLoggerDebugBot(jogador.nome, jogador.temperatura) : undefined;
    jogada.set(
      jogador.id,
      new DecisorJogadaPorTemperatura({ temperatura: jogador.temperatura, rng: config.rng, logger }),
    );
    declaracao.set(jogador.id, new DecisorDeclaracaoBot(jogador.temperatura, config.rng, { ...parametros(logger) }));
  });
  return { jogada, declaracao };
}

function parametros(logger: ReturnType<typeof criarLoggerDebugBot> | undefined) {
  return { poucasBaixas: 1, declaracaoBaixa: 1, logger };
}

export function fabricarPartida(
  jogadores: Jogador[],
  decisoresHumanos: { jogada: DecisorJogada; declaracao: DecisorDeclaracao },
  callbacks: CallbacksPartida,
): Partida {
  const emissor = createEmissorEventos();
  subscreverEventos(emissor, callbacks);
  const rng = new RngComSeed(Date.now());
  const jogadoresComBots = aplicarPerfisBots(jogadores, sortearPerfisBots(jogadores, rng));
  const decisores = criarDecisores({
    humanos: decisoresHumanos,
    jogadores: jogadoresComBots,
    rng,
    modoDebug: callbacks.modoDebug ?? false,
  });
  return new Partida(jogadoresComBots, emissor, { ...decisores, rng });
}
