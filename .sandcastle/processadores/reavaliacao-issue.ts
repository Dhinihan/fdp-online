import {
  LABEL_BLOQUEIO_SANDCASTLE,
  LABEL_EXECUCAO_SANDCASTLE,
  LABEL_ESPERA_SANDCASTLE,
  adicionarLabelIssue,
  comentarIssue,
  issueEhPullRequest,
  lerIssue,
  listarIssuesEmEspera,
  removerLabelIssue,
  type IssueGitHub,
} from '../github';
import { analisarBlockedBy } from './bloqueios-issue';

export function reavaliarIssuesEmEspera(): void {
  for (const issue of listarIssuesEmEspera()) {
    const motivoBloqueio = avaliarBlockedByInvalido(issue);

    if (motivoBloqueio) {
      const comentario = montarComentarioBloqueioBlockedBy(motivoBloqueio);
      comentarIssue(issue.number, comentario);
      adicionarLabelIssue(issue.number, LABEL_BLOQUEIO_SANDCASTLE);
      removerLabelIssue(issue.number, LABEL_ESPERA_SANDCASTLE);
      removerLabelIssue(issue.number, LABEL_EXECUCAO_SANDCASTLE);
      continue;
    }

    if (todosBloqueadoresFechados(issue.body)) {
      removerLabelIssue(issue.number, LABEL_ESPERA_SANDCASTLE);
      adicionarLabelIssue(issue.number, LABEL_EXECUCAO_SANDCASTLE);
    }
  }
}

function todosBloqueadoresFechados(corpo: string): boolean {
  const bloqueadores = extrairBloqueadores(corpo);

  return bloqueadores.length > 0 && bloqueadores.every(estaFechado);
}

function extrairBloqueadores(corpo: string): number[] {
  const resultado = analisarBlockedBy(corpo);

  if (resultado.status === 'invalido') {
    return [];
  }

  return resultado.dependencias;
}

function estaFechado(numero: number): boolean {
  try {
    return lerIssue(numero).state === 'CLOSED';
  } catch {
    return false;
  }
}

function avaliarBlockedByInvalido(issue: IssueGitHub): string | null {
  const resultado = analisarBlockedBy(issue.body || '');

  if (resultado.status === 'invalido') {
    return resultado.motivo;
  }

  for (const dependencia of resultado.dependencias) {
    if (issueEhPullRequest(dependencia)) {
      return `secao \`## Blocked by\` referencia a PR #${String(dependencia)} em vez de issue`;
    }

    try {
      lerIssue(dependencia);
    } catch (erro) {
      if (ehErroDependenciaInvalida(erro)) {
        return `secao \`## Blocked by\` referencia #${String(dependencia)} que nao pode ser lida como issue`;
      }

      return null;
    }
  }

  return null;
}

function ehErroDependenciaInvalida(erro: unknown): boolean {
  if (!(erro instanceof Error)) {
    return false;
  }

  const mensagem = erro.message.toLowerCase();

  return (
    mensagem.includes('404') ||
    mensagem.includes('not found') ||
    mensagem.includes('could not resolve to an issue') ||
    mensagem.includes('could not resolve to issue')
  );
}

function montarComentarioBloqueioBlockedBy(motivo: string): string {
  return [
    'Bloqueio manual aplicado: o campo `## Blocked by` desta issue esta invalido para o fluxo automatico.',
    `Motivo: ${motivo}.`,
    'Para destravar, corrija a secao para listar apenas issues deste repositorio no formato `#123`, uma por linha, ou remova `sandcastle:waiting` se esta issue nao estiver aguardando dependencias.',
  ].join('\n');
}
