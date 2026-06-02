/**
 * Boundary de leitura da Sequência de Vitórias persistida (`fdp.trofeus.v1`).
 *
 * Espelha `carregar-ranking.ts`: a leitura é estrita — qualquer conteúdo que
 * não seja um snapshot `versao: 1` íntegro vira o estado zero, para nunca
 * entregar dado corrompido como confiável. Invariante: `sequenciaAtual` é um
 * inteiro ≥ 0 e, nesta slice, `maiorTrofeu` é sempre `null`.
 */

import { CHAVE_TROFEUS, SNAPSHOT_ZERO } from './tipos';
import type { SnapshotTrofeus } from './tipos';

export { CHAVE_TROFEUS } from './tipos';

/** Lê o snapshot bruto; qualquer conteúdo inválido vira o estado zero. */
export function lerSnapshot(armazenamento: Pick<Storage, 'getItem'>): SnapshotTrofeus {
  const bruto = armazenamento.getItem(CHAVE_TROFEUS);
  if (bruto === null) return SNAPSHOT_ZERO;
  try {
    return validar(JSON.parse(bruto));
  } catch {
    return SNAPSHOT_ZERO;
  }
}

function validar(conteudo: unknown): SnapshotTrofeus {
  if (typeof conteudo !== 'object' || conteudo === null) return SNAPSHOT_ZERO;
  const { versao, sequenciaAtual, maiorTrofeu } = conteudo as Record<string, unknown>;
  if (versao !== 1 || maiorTrofeu !== null || !ehContagem(sequenciaAtual)) return SNAPSHOT_ZERO;
  return { versao: 1, sequenciaAtual, maiorTrofeu: null };
}

function ehContagem(valor: unknown): valor is number {
  return typeof valor === 'number' && Number.isInteger(valor) && valor >= 0;
}
