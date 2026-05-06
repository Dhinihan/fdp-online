import { BotDeterministico } from '@/adapters/bots/BotDeterministico';
import type { Carta, Valor } from '@/core/Carta';
import type { DecisorJogada } from '@/core/portas/DecisorJogada';
import { Rodada } from '@/core/Rodada';
import { createEmissorEventos } from '@/store/emissor-eventos';
import type { Jogador } from '@/types/entidades';

export interface CallbacksRodada {
  onCartaJogada: () => void;
  onTurnoGanho: (jogadorId: string) => void;
  onRodadaEncerrada: () => void;
  onManilhaVirada?: (cartaVirada: Carta, manilha: Valor) => void;
}

export function fabricarRodada(jogadores: Jogador[], decisorHumano: DecisorJogada, callbacks: CallbacksRodada): Rodada {
  const emissor = createEmissorEventos();
  emissor.on('CARTA_JOGADA', callbacks.onCartaJogada);
  emissor.on('TURNO_GANHO', (evento) => {
    callbacks.onTurnoGanho(evento.jogadorId);
  });
  emissor.on('RODADA_ENCERRADA', callbacks.onRodadaEncerrada);
  emissor.on('MANILHA_VIRADA', (evento) => {
    callbacks.onManilhaVirada?.(evento.cartaVirada, evento.manilha);
  });
  const decisores = new Map<string, DecisorJogada>([
    ['humano', decisorHumano],
    ['bot1', new BotDeterministico()],
    ['bot2', new BotDeterministico()],
    ['bot3', new BotDeterministico()],
  ]);
  return new Rodada(jogadores, decisores, emissor);
}
