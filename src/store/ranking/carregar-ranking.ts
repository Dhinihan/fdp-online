/**
 * Caminho de leitura do Ranking persistido.
 *
 * Esta fatia (#244) só lê o snapshot para distinguir vazio de preenchido.
 * A gravação e a agregação de métricas entram no #245, que estende
 * `ParticipanteRanking` com os campos derivados (win rate, posição média).
 */

export const CHAVE_RANKING = 'fdp.ranking.v1';

export interface ParticipanteRanking {
  nome: string;
  humano: boolean;
  vitorias: number;
  partidas: number;
  somaPosicoes: number;
}

export interface RankingPersistido {
  versao: 1;
  participantes: ParticipanteRanking[];
}

const RANKING_VAZIO: RankingPersistido = { versao: 1, participantes: [] };

export function carregarRanking(armazenamento: Pick<Storage, 'getItem'>): RankingPersistido {
  const bruto = armazenamento.getItem(CHAVE_RANKING);
  if (bruto === null) return RANKING_VAZIO;
  return interpretar(bruto);
}

function interpretar(bruto: string): RankingPersistido {
  try {
    const conteudo: unknown = JSON.parse(bruto);
    if (!ehSnapshotValido(conteudo)) return RANKING_VAZIO;
    return { versao: 1, participantes: conteudo.participantes };
  } catch {
    return RANKING_VAZIO;
  }
}

function ehSnapshotValido(conteudo: unknown): conteudo is { participantes: ParticipanteRanking[] } {
  return (
    typeof conteudo === 'object' &&
    conteudo !== null &&
    'participantes' in conteudo &&
    Array.isArray(conteudo.participantes)
  );
}
