import type { Carta, Jogador, Valor } from './entidades';

export interface EventoBase {
  id: string;
  timestamp: number;
  tipo: string;
}

export interface JogoIniciado extends EventoBase {
  tipo: 'JOGO_INICIADO';
  jogadores: Jogador[];
  rodadaAtual: number;
}

export interface ManilhaVirada extends EventoBase {
  tipo: 'MANILHA_VIRADA';
  cartaVirada: Carta;
  manilha: Valor;
}

export interface DeclaracaoFeita extends EventoBase {
  tipo: 'DECLARACAO_FEITA';
  jogadorId: string;
  declarado: number;
}

export interface CartaJogada extends EventoBase {
  tipo: 'CARTA_JOGADA';
  jogadorId: string;
  carta: Carta;
  posicaoMesa: number;
}

export interface TurnoGanho extends EventoBase {
  tipo: 'TURNO_GANHO';
  jogadorId: string;
  cartas: Carta[];
}

export interface TurnoEmpatado extends EventoBase {
  tipo: 'TURNO_EMPATADO';
  ultimoEmpatadoId: string;
  cartas: Carta[];
}

export interface RodadaEncerrada extends EventoBase {
  tipo: 'RODADA_ENCERRADA';
  placar: Record<string, number>;
  proximaRodada: number | null;
}

export interface RodadaIniciada extends EventoBase {
  tipo: 'RODADA_INICIADA';
  numeroRodada: number;
  cartasPorRodada: number;
  embaralhadorId: string;
  jogadoresAtivos: string[];
}

export interface PontuacaoAplicada extends EventoBase {
  tipo: 'PONTUACAO_APLICADA';
  placar: Record<string, number>;
  penalidades: Record<string, number>;
}

export interface JogoEncerrado extends EventoBase {
  tipo: 'JOGO_ENCERRADO';
  classificacao: Jogador[];
}

export type EventoDominio =
  | JogoIniciado
  | ManilhaVirada
  | DeclaracaoFeita
  | CartaJogada
  | TurnoGanho
  | TurnoEmpatado
  | RodadaEncerrada
  | RodadaIniciada
  | PontuacaoAplicada
  | JogoEncerrado;
