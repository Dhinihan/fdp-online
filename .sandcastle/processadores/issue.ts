import {
  LABEL_BLOQUEIO_SANDCASTLE,
  LABEL_EXECUCAO_SANDCASTLE,
  LABEL_EXECUTANDO_SANDCASTLE,
  LABEL_ESPERA_SANDCASTLE,
  adicionarLabelIssue,
  comentarIssue,
  issueEhPullRequest,
  lerComentariosIssue,
  lerIssue,
  listarIssuesAguardando,
  listarIssuesCandidatas,
  removerLabelIssue,
  type ComentarioGitHub,
  type IssueGitHub,
} from '../github';
import { lerArquivo } from '../runner';
import { analisarBlockedBy } from './bloqueios-issue';
import type { AdaptadorProcessamento, ItemFila } from './tipos';

const LIMITE_COMENTARIOS_CONTEXTO = 5;
const CAMINHO_PROMPT = new URL('../prompts/agente.md', import.meta.url);

interface ContextoIssue {
  comentarios: ComentarioGitHub[];
}

export const adaptadorIssue: AdaptadorProcessamento<IssueGitHub, ContextoIssue> = {
  tipo: 'issue',
  listarElegiveis,
  carregarItem: lerIssue,
  avaliarElegibilidade,
  coletarContexto,
  formatarDryRun,
  fazerLock,
  desfazerLock,
  montarPrompt,
  obterBranch,
};

function listarElegiveis(): ItemFila[] {
  reavaliarIssuesEmEspera();

  return listarIssuesCandidatas().map((issue) => ({
    tipo: 'issue',
    numero: issue.number,
    criadoEm: issue.createdAt,
  }));
}

function avaliarElegibilidade(issue: IssueGitHub): string | null {
  if (issue.state !== 'OPEN') {
    return `Issue #${String(issue.number)} nao esta aberta. Estado atual: ${issue.state}.`;
  }

  if (possuiLabel(issue, LABEL_EXECUTANDO_SANDCASTLE)) {
    return `Issue #${String(issue.number)} ja esta em execucao com a label ${LABEL_EXECUTANDO_SANDCASTLE}.`;
  }

  if (possuiLabel(issue, LABEL_BLOQUEIO_SANDCASTLE)) {
    return `Issue #${String(issue.number)} esta bloqueada com a label ${LABEL_BLOQUEIO_SANDCASTLE}.`;
  }

  if (!possuiLabel(issue, LABEL_EXECUCAO_SANDCASTLE)) {
    return `Issue #${String(issue.number)} nao esta liberada. Adicione a label ${LABEL_EXECUCAO_SANDCASTLE}.`;
  }

  return null;
}

function coletarContexto(issue: IssueGitHub): ContextoIssue {
  return { comentarios: lerComentariosIssue(issue.number) };
}

function formatarDryRun(issue: IssueGitHub, contexto: ContextoIssue): string {
  return [
    `DRY RUN: issue #${String(issue.number)} seria enviada ao agente.`,
    `Titulo: ${issue.title}`,
    `Labels: ${formatarLabels(issue)}`,
    `Comentarios no contexto: ${String(Math.min(contexto.comentarios.length, LIMITE_COMENTARIOS_CONTEXTO))}`,
  ].join('\n');
}

function fazerLock(issue: IssueGitHub): void {
  adicionarLabelIssue(issue.number, LABEL_EXECUTANDO_SANDCASTLE);
  removerLabelIssue(issue.number, LABEL_EXECUCAO_SANDCASTLE);
}

function desfazerLock(issue: IssueGitHub): void {
  removerLabelIssue(issue.number, LABEL_EXECUTANDO_SANDCASTLE);
}

function montarPrompt(issue: IssueGitHub, contexto: ContextoIssue): string {
  const comentarios = contexto.comentarios.slice(-LIMITE_COMENTARIOS_CONTEXTO).map(formatarComentario).join('\n\n');

  return [
    aplicarPlaceholdersPrompt(lerArquivo(CAMINHO_PROMPT)),
    ...montarContextoIssue(issue),
    'Comentarios recentes:',
    comentarios || '(sem comentarios)',
  ].join('\n');
}

function obterBranch(issue: IssueGitHub): string {
  return `sandcastle-issue-${String(issue.number)}`;
}

function aplicarPlaceholdersPrompt(promptBase: string): string {
  return promptBase
    .replaceAll('{{label_execucao}}', LABEL_EXECUCAO_SANDCASTLE)
    .replaceAll('{{label_executando}}', LABEL_EXECUTANDO_SANDCASTLE);
}

function montarContextoIssue(issue: IssueGitHub): string[] {
  return [
    'Contexto da issue:',
    `Numero: #${String(issue.number)}`,
    `Titulo: ${issue.title}`,
    `Estado: ${issue.state}`,
    `Labels: ${formatarLabels(issue)}`,
    '',
    'Corpo:',
    issue.body || '(sem corpo)',
    '',
  ];
}

function formatarComentario(comentario: ComentarioGitHub): string {
  return [`Autor: ${comentario.author.login}`, `Criado em: ${comentario.createdAt}`, comentario.body].join('\n');
}

function formatarLabels(issue: IssueGitHub): string {
  return issue.labels.map((label) => label.name).join(', ') || 'nenhuma';
}

function possuiLabel(issue: IssueGitHub, label: string): boolean {
  return issue.labels.some((item) => item.name === label);
}

function reavaliarIssuesEmEspera(): void {
  for (const issue of listarIssuesAguardando()) {
    const motivo = avaliarBlockedByInvalido(issue);

    if (!motivo) {
      continue;
    }

    const comentario = montarComentarioBloqueioBlockedBy(motivo);
    comentarIssue(issue.number, comentario);
    adicionarLabelIssue(issue.number, LABEL_BLOQUEIO_SANDCASTLE);
    removerLabelIssue(issue.number, LABEL_ESPERA_SANDCASTLE);
    removerLabelIssue(issue.number, LABEL_EXECUCAO_SANDCASTLE);
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
      if (!ehErroDependenciaInvalida(erro)) {
        throw erro;
      }

      return `secao \`## Blocked by\` referencia #${String(dependencia)} que nao pode ser lida como issue`;
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
