import { BotDeterministico } from '@/adapters/bots/BotDeterministico';
import { DecisorDeclaracaoBot } from '@/adapters/bots/DecisorDeclaracaoBot';
import type { Carta, Valor } from '@/core/Carta';
import { Partida } from '@/core/Partida';
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
  onRodadaIniciada?: () => void;
}

function registrarCallbacks(emissor: ReturnType<typeof createEmissorEventos>, callbacks: CallbacksRodada): void {
  emissor.on('CARTA_JOGADA', callbacks.onCartaJogada);
  emissor.on('TURNO_GANHO', (evento) => {
    callbacks.onTurnoGanho(evento.jogadorId);
  });
  emissor.on('TURNO_EMPATADO', callbacks.onTurnoEmpatado);
  emissor.on('RODADA_ENCERRADA', callbacks.onRodadaEncerrada);
  emissor.on('RODADA_INICIADA', () => callbacks.onRodadaIniciada?.());
  emissor.on('MANILHA_VIRADA', (evento) => callbacks.onManilhaVirada?.(evento.cartaVirada, evento.manilha));
}

function criarDecisores(decisoresHumanos: { jogada: DecisorJogada; declaracao: DecisorDeclaracao }): {
  jogada: Map<string, DecisorJogada>;
  declaracao: Map<string, DecisorDeclaracao>;
} {
  const jogada = new Map<string, DecisorJogada>([
    ['humano', decisoresHumanos.jogada],
    ['bot1', new BotDeterministico()],
    ['bot2', new BotDeterministico()],
    ['bot3', new BotDeterministico()],
  ]);
  const declaracao = new Map<string, DecisorDeclaracao>([
    ['humano', decisoresHumanos.declaracao],
    ['bot1', new DecisorDeclaracaoBot()],
    ['bot2', new DecisorDeclaracaoBot()],
    ['bot3', new DecisorDeclaracaoBot()],
  ]);
  return { jogada, declaracao };
}

export function fabricarRodada(
  jogadores: Jogador[],
  decisoresHumanos: { jogada: DecisorJogada; declaracao: DecisorDeclaracao },
  callbacks: CallbacksRodada,
): Rodada {
  const emissor = createEmissorEventos();
  registrarCallbacks(emissor, callbacks);
  const decisores = criarDecisores(decisoresHumanos);
  return new Rodada(jogadores, emissor, decisores);
}

export function fabricarPartida(
  jogadores: Jogador[],
  decisoresHumanos: { jogada: DecisorJogada; declaracao: DecisorDeclaracao },
  callbacks: CallbacksRodada,
): Partida {
  const emissor = createEmissorEventos();
  registrarCallbacks(emissor, callbacks);
  const decisores = criarDecisores(decisoresHumanos);
  return new Partida(jogadores, emissor, decisores);
}
