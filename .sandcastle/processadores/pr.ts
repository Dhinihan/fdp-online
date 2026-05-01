import {
  LABEL_BLOQUEIO_SANDCASTLE,
  LABEL_REVISAO_SANDCASTLE,
  LABEL_REVISANDO_SANDCASTLE,
  adicionarLabelPullRequest,
  lerPullRequest,
  lerThreadsRevisaoPullRequest,
  listarPullRequestsCandidatas,
  removerLabelPullRequest,
  type PullRequestGitHub,
  type ThreadRevisaoGitHub,
} from '../github';
import { lerArquivo } from '../runner';
import { validarBranchLocalPr } from './pr-branch';
import type { AdaptadorProcessamento, ItemFila } from './tipos';

const CAMINHO_PROMPT = new URL('../prompts/revisao-pr.md', import.meta.url);

interface ContextoPr {
  threads: ThreadRevisaoGitHub[];
}

export const adaptadorPr: AdaptadorProcessamento<PullRequestGitHub, ContextoPr> = {
  tipo: 'pr',
  listarElegiveis,
  carregarItem: lerPullRequest,
  avaliarElegibilidade,
  coletarContexto,
  avaliarContexto,
  formatarDryRun,
  fazerLock,
  desfazerLock,
  montarPrompt,
  obterBranch,
};

function listarElegiveis(): ItemFila[] {
  return listarPullRequestsCandidatas().map((pr) => ({
    tipo: 'pr',
    numero: pr.number,
    criadoEm: pr.createdAt,
  }));
}

function avaliarElegibilidade(pr: PullRequestGitHub): string | null {
  if (pr.state !== 'OPEN') {
    return `PR #${String(pr.number)} nao esta aberta. Estado atual: ${pr.state}.`;
  }

  if (possuiLabel(pr, LABEL_REVISANDO_SANDCASTLE)) {
    return `PR #${String(pr.number)} ja esta em execucao com a label ${LABEL_REVISANDO_SANDCASTLE}.`;
  }

  if (possuiLabel(pr, LABEL_BLOQUEIO_SANDCASTLE)) {
    return `PR #${String(pr.number)} esta bloqueada com a label ${LABEL_BLOQUEIO_SANDCASTLE}.`;
  }

  if (!possuiLabel(pr, LABEL_REVISAO_SANDCASTLE)) {
    return `PR #${String(pr.number)} nao esta liberada. Adicione a label ${LABEL_REVISAO_SANDCASTLE}.`;
  }

  return null;
}

function coletarContexto(pr: PullRequestGitHub): ContextoPr {
  const threads = lerThreadsRevisaoPullRequest(pr.number).filter((thread) => !thread.isResolved && !thread.isOutdated);

  return { threads };
}

function avaliarContexto(pr: PullRequestGitHub, contexto: ContextoPr): string | null {
  if (contexto.threads.length === 0) {
    return `PR #${String(pr.number)} sem threads abertas elegiveis.`;
  }

  return null;
}

function formatarDryRun(pr: PullRequestGitHub, contexto: ContextoPr): string {
  return [
    `DRY RUN: PR #${String(pr.number)} seria enviada ao agente.`,
    `Titulo: ${pr.title}`,
    `Labels: ${formatarLabels(pr)}`,
    `Branch: ${formatarHeadPr(pr)}`,
    `Threads elegiveis: ${String(contexto.threads.length)}`,
  ].join('\n');
}

function fazerLock(pr: PullRequestGitHub): void {
  adicionarLabelPullRequest(pr.number, LABEL_REVISANDO_SANDCASTLE);
  removerLabelPullRequest(pr.number, LABEL_REVISAO_SANDCASTLE);
}

function desfazerLock(pr: PullRequestGitHub): void {
  removerLabelPullRequest(pr.number, LABEL_REVISANDO_SANDCASTLE);
}

function montarPrompt(pr: PullRequestGitHub, contexto: ContextoPr): string {
  return [lerArquivo(CAMINHO_PROMPT), ...montarContextoPr(pr), ...contexto.threads.flatMap(montarBlocoThread)].join(
    '\n',
  );
}

function obterBranch(pr: PullRequestGitHub): string {
  validarBranchLocalPr(pr);
  return pr.headRefName;
}

function montarContextoPr(pr: PullRequestGitHub): string[] {
  return [
    'Contexto da PR:',
    `Numero: #${String(pr.number)}`,
    `Titulo: ${pr.title}`,
    `Branch: ${formatarHeadPr(pr)}`,
    `Estado: ${pr.state}`,
    `Labels: ${formatarLabels(pr)}`,
    `Review decision: ${pr.reviewDecision ?? 'nenhuma'}`,
    '',
    'Threads abertas:',
    '',
  ];
}

function montarBlocoThread(thread: ThreadRevisaoGitHub, indice: number): string[] {
  return [
    `Thread ${String(indice + 1)}`,
    `Path: ${thread.path ?? 'sem path'}`,
    `Line: ${formatarLinha(thread)}`,
    'Comentarios:',
    ...thread.comments.flatMap(formatarComentarioThread),
  ];
}

function formatarComentarioThread(comentario: ThreadRevisaoGitHub['comments'][number]): string[] {
  return [
    `Autor: ${comentario.author.login}`,
    `Criado em: ${comentario.createdAt}`,
    `URL: ${comentario.url}`,
    comentario.body,
    '',
  ];
}

function formatarLinha(thread: ThreadRevisaoGitHub): string {
  if (thread.line !== null) {
    return String(thread.line);
  }

  if (thread.originalLine !== null) {
    return `${String(thread.originalLine)} (original)`;
  }

  return 'sem linha';
}

function formatarLabels(pr: PullRequestGitHub): string {
  return pr.labels.map((label) => label.name).join(', ') || 'nenhuma';
}

function possuiLabel(pr: PullRequestGitHub, label: string): boolean {
  return pr.labels.some((item) => item.name === label);
}

function formatarHeadPr(pr: PullRequestGitHub): string {
  return `${pr.headRepositoryOwner.login}:${pr.headRefName} @ ${pr.headRefOid}`;
}
