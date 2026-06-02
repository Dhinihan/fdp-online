/**
 * Contrato persistido do Ranking (chave `fdp.ranking.v1`) e os tipos derivados
 * usados na leitura/escrita. Guardamos somatórios brutos por participante
 * (não histórico de partidas); as métricas são recalculadas na leitura.
 */

export const CHAVE_RANKING = 'fdp.ranking.v1';

export interface ParticipantePersistido {
  nomeExibicao: string;
  partidas: number;
  vitorias: number;
  somaPosicoes: number;
}

export interface SnapshotRanking {
  versao: 1;
  participantes: Record<string, ParticipantePersistido>;
}

export const SNAPSHOT_VAZIO: SnapshotRanking = { versao: 1, participantes: {} };

/** Participante já materializado com sua chave de identidade e o flag humano. */
export interface ParticipanteRanking extends ParticipantePersistido {
  chave: string;
  humano: boolean;
}
