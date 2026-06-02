/**
 * Boundary de leitura do Ranking persistido (`fdp.ranking.v1`).
 *
 * O snapshot guarda somatórios brutos por participante num `Record` chaveado
 * pela identidade de Ranking (`humano`, `bot:bras`). A leitura é estrita:
 * qualquer conteúdo que não seja um snapshot `versao: 1` com participantes
 * íntegros é tratado como vazio, para nunca entregar dado corrompido como
 * confiável. Para a tela, o `Record` é materializado numa lista com a chave e o
 * flag humano; as métricas e a ordem são calculadas em `ordenarRanking`.
 */

import { CHAVE_RANKING, SNAPSHOT_VAZIO } from './tipos';
import type { ParticipanteRanking, ParticipantePersistido, SnapshotRanking } from './tipos';

export { CHAVE_RANKING } from './tipos';
export type { ParticipanteRanking } from './tipos';

export type RankingPersistido = { tipo: 'vazio' } | { tipo: 'populado'; participantes: ParticipanteRanking[] };

const VAZIO: RankingPersistido = { tipo: 'vazio' };

export function carregarRanking(armazenamento: Pick<Storage, 'getItem'>): RankingPersistido {
  const participantes = materializar(lerSnapshot(armazenamento));
  if (participantes.length === 0) return VAZIO;
  return { tipo: 'populado', participantes };
}

/** Lê o snapshot bruto; qualquer conteúdo inválido vira o snapshot vazio. */
export function lerSnapshot(armazenamento: Pick<Storage, 'getItem'>): SnapshotRanking {
  const bruto = armazenamento.getItem(CHAVE_RANKING);
  if (bruto === null) return SNAPSHOT_VAZIO;
  try {
    return validar(JSON.parse(bruto));
  } catch {
    return SNAPSHOT_VAZIO;
  }
}

function materializar(snapshot: SnapshotRanking): ParticipanteRanking[] {
  return Object.entries(snapshot.participantes).map(([chave, p]) => ({
    ...p,
    chave,
    humano: chave === 'humano',
  }));
}

function validar(conteudo: unknown): SnapshotRanking {
  if (!ehSnapshotV1(conteudo)) return SNAPSHOT_VAZIO;
  const entradas = Object.entries(conteudo.participantes);
  if (!entradas.every(([chave, valor]) => chave !== '' && ehParticipante(valor))) return SNAPSHOT_VAZIO;
  return conteudo as SnapshotRanking;
}

function ehSnapshotV1(conteudo: unknown): conteudo is { versao: 1; participantes: Record<string, unknown> } {
  if (typeof conteudo !== 'object' || conteudo === null) return false;
  const registro = conteudo as Record<string, unknown>;
  const participantes = registro.participantes;
  return (
    registro.versao === 1 &&
    typeof participantes === 'object' &&
    participantes !== null &&
    !Array.isArray(participantes)
  );
}

function ehParticipante(valor: unknown): valor is ParticipantePersistido {
  if (typeof valor !== 'object' || valor === null) return false;
  const { nomeExibicao, partidas, vitorias, somaPosicoes } = valor as Record<string, unknown>;
  if (typeof nomeExibicao !== 'string' || nomeExibicao === '') return false;
  if (!ehContagem(partidas) || !ehContagem(vitorias) || !ehContagem(somaPosicoes)) return false;
  return ehSomatorioCoerente(partidas, vitorias, somaPosicoes);
}

/**
 * Invariantes do somatório: cada participante persistido apareceu em ao menos
 * uma Partida; não vence mais Partidas do que disputou; e, como cada aparição
 * contribui com posição ≥ 1, a soma das posições nunca fica abaixo do total de
 * Partidas (o que mantém a Pos. média ≥ 1).
 */
function ehSomatorioCoerente(partidas: number, vitorias: number, somaPosicoes: number): boolean {
  return partidas >= 1 && vitorias <= partidas && somaPosicoes >= partidas;
}

function ehContagem(valor: unknown): valor is number {
  return typeof valor === 'number' && Number.isInteger(valor) && valor >= 0;
}
