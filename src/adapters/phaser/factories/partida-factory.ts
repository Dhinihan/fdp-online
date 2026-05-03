import { BotDeterministico } from '@/adapters/bots/BotDeterministico';
import { Partida } from '@/core/Partida';
import type { DecisorJogada } from '@/core/portas/DecisorJogada';
import { createEmissorEventos } from '@/store/emissor-eventos';
import type { Jogador } from '@/types/entidades';

export interface CallbacksPartida {
  onCartaJogada: () => void;
  onTurnoGanho: (jogadorId: string) => void;
  onRodadaEncerrada: () => void;
}

export function fabricarPartida(
  jogadores: Jogador[],
  decisorHumano: DecisorJogada,
  callbacks: CallbacksPartida,
): Partida {
  const emissor = createEmissorEventos();
  emissor.on('CARTA_JOGADA', callbacks.onCartaJogada);
  emissor.on('TURNO_GANHO', (evento) => {
    callbacks.onTurnoGanho(evento.jogadorId);
  });
  emissor.on('RODADA_ENCERRADA', callbacks.onRodadaEncerrada);
  const decisores = new Map<string, DecisorJogada>([
    ['humano', decisorHumano],
    ['bot1', new BotDeterministico()],
    ['bot2', new BotDeterministico()],
    ['bot3', new BotDeterministico()],
  ]);
  return new Partida(jogadores, decisores, emissor);
}
