import { BotDeterministico } from '@/adapters/bots/BotDeterministico';
import { DecisorDeclaracaoBot } from '@/adapters/bots/DecisorDeclaracaoBot';
import type { Carta, Valor } from '@/core/Carta';
import type { DecisorDeclaracao } from '@/core/portas/DecisorDeclaracao';
import type { DecisorJogada } from '@/core/portas/DecisorJogada';
import { Rodada } from '@/core/Rodada';
import { createEmissorEventos } from '@/store/emissor-eventos';
import type { Jogador } from '@/types/entidades';

export interface CallbacksRodada {
  onCartaJogada: () => void;
  onTurnoGanho: (jogadorId: string) => void;
  onTurnoEmpatado: () => void;
  onRodadaEncerrada: () => void;
  onManilhaVirada?: (cartaVirada: Carta, manilha: Valor) => void;
}

export function fabricarRodada(
  jogadores: Jogador[],
  decisoresHumanos: { jogada: DecisorJogada; declaracao: DecisorDeclaracao },
  callbacks: CallbacksRodada,
): Rodada {
  const emissor = createEmissorEventos();
  emissor.on('CARTA_JOGADA', callbacks.onCartaJogada);
  emissor.on('TURNO_GANHO', (evento) => {
    callbacks.onTurnoGanho(evento.jogadorId);
  });
  emissor.on('TURNO_EMPATADO', callbacks.onTurnoEmpatado);
  emissor.on('RODADA_ENCERRADA', callbacks.onRodadaEncerrada);
  emissor.on('MANILHA_VIRADA', (evento) => {
    callbacks.onManilhaVirada?.(evento.cartaVirada, evento.manilha);
  });
  const decisores = new Map<string, DecisorJogada>([
    ['humano', decisoresHumanos.jogada],
    ['bot1', new BotDeterministico()],
    ['bot2', new BotDeterministico()],
    ['bot3', new BotDeterministico()],
  ]);
  const decisoresDeclaracao = new Map<string, DecisorDeclaracao>([
    ['humano', decisoresHumanos.declaracao],
    ['bot1', new DecisorDeclaracaoBot()],
    ['bot2', new DecisorDeclaracaoBot()],
    ['bot3', new DecisorDeclaracaoBot()],
  ]);
  return new Rodada(jogadores, emissor, { jogada: decisores, declaracao: decisoresDeclaracao });
}
