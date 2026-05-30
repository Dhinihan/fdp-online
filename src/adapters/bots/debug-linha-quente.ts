import type { EstadoEmJogo } from '@/types/estado-rodada';
import { ehUltimoDaMesa } from './contexto-posicao-mesa';
import type { PosicaoMesaJogadaDebug } from './debug-jogada-bot';

export function definirPosicao(estado: EstadoEmJogo): PosicaoMesaJogadaDebug {
  if (estado.mesa.length === 0) return 'abre';
  if (ehUltimoDaMesa(estado)) return 'fecha';
  return 'meio';
}
