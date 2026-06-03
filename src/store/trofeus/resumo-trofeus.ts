import type { Nivel } from './tabela-trofeus';
import type { SnapshotTrofeus } from './tipos';

/**
 * Resumo de Troféus exibido no Ranking. Sua presença já significa "há algo a
 * exibir": só existe quando o humano conquistou ao menos o Bronze. O resultado
 * neutro — nenhum Troféu — é representado por `null`, e o renderer nunca precisa
 * reinspecionar o snapshot.
 */
export interface ResumoTrofeus {
  maiorTrofeu: Nivel;
  sequenciaAtual: number;
}

export function resumirTrofeus(snapshot: SnapshotTrofeus): ResumoTrofeus | null {
  if (snapshot.maiorTrofeu === null) return null;
  return { maiorTrofeu: snapshot.maiorTrofeu, sequenciaAtual: snapshot.sequenciaAtual };
}
