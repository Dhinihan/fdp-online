import type { Valor } from '@/types/entidades';
import type { EventoDominio } from '@/types/eventos-dominio';
import type { Carta } from './Carta';

export interface EmissorRodada {
  emit(evento: EventoDominio): void;
}

interface CartaJogadaConfig {
  jogadorId: string;
  carta: Carta;
  posicaoMesa: number;
}

export function criarEventoBase() {
  return { id: crypto.randomUUID(), timestamp: Date.now() };
}

export function emitirManilhaVirada(emissor: EmissorRodada, cartaVirada: Carta, manilha: Valor): void {
  emissor.emit({ ...criarEventoBase(), tipo: 'MANILHA_VIRADA', cartaVirada, manilha });
}

export function emitirDeclaracaoFeita(emissor: EmissorRodada, jogadorId: string, declarado: number): void {
  emissor.emit({ ...criarEventoBase(), tipo: 'DECLARACAO_FEITA', jogadorId, declarado });
}

export function emitirCartaJogada(emissor: EmissorRodada, config: CartaJogadaConfig): void {
  emissor.emit({ ...criarEventoBase(), tipo: 'CARTA_JOGADA', ...config });
}

export function emitirTurnoGanho(emissor: EmissorRodada, jogadorId: string, cartas: Carta[]): void {
  emissor.emit({ ...criarEventoBase(), tipo: 'TURNO_GANHO', jogadorId, cartas });
}

export function emitirTurnoEmpatado(emissor: EmissorRodada, ultimoEmpatadoId: string, cartas: Carta[]): void {
  emissor.emit({ ...criarEventoBase(), tipo: 'TURNO_EMPATADO', ultimoEmpatadoId, cartas });
}

export function emitirRodadaEncerrada(emissor: EmissorRodada, placar: Record<string, number>): void {
  emissor.emit({ ...criarEventoBase(), tipo: 'RODADA_ENCERRADA', placar, proximaRodada: null });
}

export function emitirPontuacaoAplicada(
  emissor: EmissorRodada,
  placar: Record<string, number>,
  penalidades: Record<string, number>,
): void {
  emissor.emit({ ...criarEventoBase(), tipo: 'PONTUACAO_APLICADA', placar, penalidades });
}
