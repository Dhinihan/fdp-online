import type { Carta } from '@/core/Carta';
import type { EstadoEmJogo } from '@/types/estado-rodada';
import { ehUltimoDaMesa } from './contextoLinhaQuente';
import type { PosicaoMesaJogadaDebug } from './debug-jogada-bot';

export interface DecisaoQuente {
  carta: Carta;
  motivo: string;
  caminho: string[];
}

export function definirPosicao(estado: EstadoEmJogo): PosicaoMesaJogadaDebug {
  if (estado.mesa.length === 0) return 'abre';
  if (ehUltimoDaMesa(estado)) return 'fecha';
  return 'meio';
}

export function criarDecisaoQuente(decisao: { carta: Carta; motivo: string }, caminho: string[]): DecisaoQuente {
  return { ...decisao, caminho };
}
