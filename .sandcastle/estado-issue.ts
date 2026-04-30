export const MARCADOR_COMENTARIO_ESTADO = '<!-- sandcastle:status -->';
import { parsearEstadoYaml, renderizarEstadoYaml, type EstadoOperacionalIssueYaml } from './estado-issue-yaml';

export type StatusOperacionalIssue = EstadoOperacionalIssueYaml['status'];
export type EstadoOperacionalIssue = EstadoOperacionalIssueYaml;

export interface ComentarioComId {
  id: number | string;
  body: string;
}

export interface ComentarioEstadoIssue {
  comentarioId: number | string;
  corpo: string;
  estado: EstadoOperacionalIssue;
}

export type AcaoPersistenciaComentarioEstado =
  | { tipo: 'criar'; corpo: string }
  | { tipo: 'atualizar'; comentarioId: number | string; corpo: string };

export function criarEstadoOperacionalInicial(): EstadoOperacionalIssue {
  return {
    status: 'pronto',
    tentativasUsadas: 0,
    cooldownAte: null,
    ultimaExecucaoEm: null,
    ultimoResultado: null,
    branch: null,
    prNumero: null,
  };
}

export function renderizarComentarioEstado(estado: EstadoOperacionalIssue): string {
  return [MARCADOR_COMENTARIO_ESTADO, '```yaml', renderizarEstadoYaml(estado), '```'].join('\n');
}

export function parsearComentarioEstado(corpo: string): EstadoOperacionalIssue | null {
  if (!corpo.includes(MARCADOR_COMENTARIO_ESTADO)) {
    return null;
  }

  const yaml = extrairBlocoYaml(corpo);

  if (!yaml) {
    return null;
  }

  return parsearEstadoYaml(yaml);
}

export function localizarComentarioEstado(comentarios: ComentarioComId[]): ComentarioEstadoIssue | null {
  for (const comentario of comentarios) {
    const estado = parsearComentarioEstado(comentario.body);

    if (estado) {
      return {
        comentarioId: comentario.id,
        corpo: comentario.body,
        estado,
      };
    }
  }

  return null;
}

export function planejarPersistenciaComentarioEstado(
  comentarios: ComentarioComId[],
  estado: EstadoOperacionalIssue,
): AcaoPersistenciaComentarioEstado {
  const comentarioExistente = localizarComentarioEstado(comentarios);
  const corpo = renderizarComentarioEstado(estado);

  if (!comentarioExistente) {
    return { tipo: 'criar', corpo };
  }

  return {
    tipo: 'atualizar',
    comentarioId: comentarioExistente.comentarioId,
    corpo,
  };
}

function extrairBlocoYaml(corpo: string): string | null {
  const resultado = corpo.match(/```yaml\n([\s\S]*?)\n```/u);
  return resultado?.[1] ?? null;
}
