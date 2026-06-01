/**
 * Caminho de leitura do Ranking persistido.
 *
 * Esta fatia (#244) só distingue ranking vazio de populado. A gravação e a
 * renderização do ranking populado (pódio + tabela) entram no #245.
 *
 * A leitura é uma boundary estrita: qualquer conteúdo que não seja um snapshot
 * `versao: 1` com uma lista de participantes íntegros é tratado como vazio, para
 * não entregar dados corrompidos como se fossem confiáveis.
 */

export const CHAVE_RANKING = 'fdp.ranking.v1';

export interface ParticipanteRanking {
  nome: string;
  humano: boolean;
  vitorias: number;
  partidas: number;
  somaPosicoes: number;
}

export type RankingPersistido = { tipo: 'vazio' } | { tipo: 'populado'; participantes: ParticipanteRanking[] };

const VAZIO: RankingPersistido = { tipo: 'vazio' };

export function carregarRanking(armazenamento: Pick<Storage, 'getItem'>): RankingPersistido {
  const bruto = armazenamento.getItem(CHAVE_RANKING);
  if (bruto === null) return VAZIO;
  return interpretar(bruto);
}

function interpretar(bruto: string): RankingPersistido {
  try {
    return classificar(JSON.parse(bruto));
  } catch {
    return VAZIO;
  }
}

function classificar(conteudo: unknown): RankingPersistido {
  if (!ehSnapshotV1(conteudo)) return VAZIO;
  const participantes = conteudo.participantes.filter(ehParticipante);
  if (participantes.length === 0 || participantes.length !== conteudo.participantes.length) return VAZIO;
  return { tipo: 'populado', participantes };
}

function ehSnapshotV1(conteudo: unknown): conteudo is { versao: 1; participantes: unknown[] } {
  if (typeof conteudo !== 'object' || conteudo === null) return false;
  const registro = conteudo as Record<string, unknown>;
  return registro.versao === 1 && Array.isArray(registro.participantes);
}

function ehParticipante(valor: unknown): valor is ParticipanteRanking {
  if (typeof valor !== 'object' || valor === null) return false;
  const p = valor as Record<string, unknown>;
  return (
    typeof p.nome === 'string' &&
    typeof p.humano === 'boolean' &&
    ehNumeroFinito(p.vitorias) &&
    ehNumeroFinito(p.partidas) &&
    ehNumeroFinito(p.somaPosicoes)
  );
}

function ehNumeroFinito(valor: unknown): valor is number {
  return typeof valor === 'number' && Number.isFinite(valor);
}
