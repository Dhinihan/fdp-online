import {
  LABEL_BLOQUEIO_SANDCASTLE,
  LABEL_EXECUCAO_SANDCASTLE,
  LABEL_ESPERA_SANDCASTLE,
  adicionarLabelIssue,
  comentarIssue,
  issueEhPullRequest,
  lerIssue,
  listarIssuesEmEspera,
  obterEstadoOperacionalIssue,
  removerLabelIssue,
  type IssueGitHub,
} from '../github';
import { analisarBlockedBy } from './bloqueios-issue';

export function reavaliarIssuesEmEspera(): void {
  for (const issue of listarIssuesEmEspera()) {
    if (obterEstadoOperacionalIssue(issue) !== 'waiting') {
      continue;
    }

    const resultado = avaliarIssueEmEspera(issue);

    if (resultado.status === 'bloquear') {
      const comentario = montarComentarioBloqueioBlockedBy(resultado.motivo);
      comentarIssue(issue.number, comentario);
      adicionarLabelIssue(issue.number, LABEL_BLOQUEIO_SANDCASTLE);
      removerLabelIssue(issue.number, LABEL_ESPERA_SANDCASTLE);
      removerLabelIssue(issue.number, LABEL_EXECUCAO_SANDCASTLE);
      continue;
    }

    if (resultado.status === 'reativar') {
      removerLabelIssue(issue.number, LABEL_ESPERA_SANDCASTLE);
      adicionarLabelIssue(issue.number, LABEL_EXECUCAO_SANDCASTLE);
    }
  }
}

export function listarDryRunIssuesEmEspera(): string[] {
  return listarIssuesEmEspera().map((issue) => formatarDryRunIssueEmEspera(issue, avaliarIssueEmEspera(issue)));
}

function formatarDryRunIssueEmEspera(issue: IssueGitHub, resultado: ResultadoReavaliacaoIssueEmEspera): string {
  const cabecalho = `DRY RUN: issue #${String(issue.number)} em ${LABEL_ESPERA_SANDCASTLE}.`;

  if (resultado.status === 'reativar') {
    return [
      cabecalho,
      `Resultado: voltaria para ${LABEL_EXECUCAO_SANDCASTLE}.`,
      'Motivo: todos os bloqueadores estao fechados.',
    ].join('\n');
  }

  if (resultado.status === 'bloquear') {
    return [cabecalho, `Resultado: viraria ${LABEL_BLOQUEIO_SANDCASTLE}.`, `Motivo: ${resultado.motivo}.`].join('\n');
  }

  return [cabecalho, `Resultado: continuaria em ${LABEL_ESPERA_SANDCASTLE}.`, `Motivo: ${resultado.motivo}.`].join(
    '\n',
  );
}

type ResultadoReavaliacaoIssueEmEspera =
  | { status: 'reativar' }
  | { status: 'manter'; motivo: string }
  | { status: 'bloquear'; motivo: string };

function avaliarIssueEmEspera(issue: IssueGitHub): ResultadoReavaliacaoIssueEmEspera {
  const motivoBloqueio = avaliarBlockedByInvalido(issue);

  if (motivoBloqueio) {
    return { status: 'bloquear', motivo: motivoBloqueio };
  }

  if (todosBloqueadoresFechados(issue.body)) {
    return { status: 'reativar' };
  }

  return { status: 'manter', motivo: 'ainda existe bloqueador aberto ou temporariamente indisponivel' };
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
