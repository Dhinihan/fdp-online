import type { Carta, Valor } from '@/core/Carta';
import { createEmissorEventos } from '@/store/emissor-eventos';

export interface CallbacksRodada {
  onCartaJogada: () => void;
  onTurnoGanho: (jogadorId: string) => void;
  onTurnoEmpatado: () => void;
  onRodadaEncerrada: () => void;
  onManilhaVirada?: (cartaVirada: Carta, manilha: Valor) => void;
  onRodadaIniciada?: () => void;
  onPontuacaoAplicada?: () => void;
  onJogoEncerrado?: (classificacao: import('@/types/entidades').Jogador[]) => void;
}

export function subscreverEventos(emissor: ReturnType<typeof createEmissorEventos>, callbacks: CallbacksRodada): void {
  emissor.on('CARTA_JOGADA', callbacks.onCartaJogada);
  emissor.on('TURNO_GANHO', (evento) => {
    callbacks.onTurnoGanho(evento.jogadorId);
  });
  emissor.on('TURNO_EMPATADO', callbacks.onTurnoEmpatado);
  emissor.on('RODADA_ENCERRADA', callbacks.onRodadaEncerrada);
  emissor.on('RODADA_INICIADA', () => callbacks.onRodadaIniciada?.());
  emissor.on('PONTUACAO_APLICADA', () => callbacks.onPontuacaoAplicada?.());
  emissor.on('MANILHA_VIRADA', (evento) => callbacks.onManilhaVirada?.(evento.cartaVirada, evento.manilha));
  emissor.on('JOGO_ENCERRADO', (evento) => callbacks.onJogoEncerrado?.(evento.classificacao));
}
