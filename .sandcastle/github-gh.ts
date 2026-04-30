import { spawnSync } from 'node:child_process';

const LABEL_EXECUCAO_SANDCASTLE = 'sandcastle:run';

interface ResultadoGh {
  stdout: string;
  stderr: string;
  status: number | null;
}

export interface IssueGitHub {
  number: number;
  title: string;
  body: string;
  state: 'OPEN' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
}

export interface ComentarioGitHub {
  id: number;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: { login: string };
}

export interface PullRequestGitHub {
  number: number;
  title: string;
  body: string;
  headRefName: string;
  state: 'OPEN' | 'CLOSED' | 'MERGED';
  url: string;
  mergedAt: string | null;
}

export interface CheckPullRequestGitHub {
  name: string;
  state: string;
  conclusion: string;
  startedAt: string;
  completedAt: string;
  link: string;
}

export function validarGhDisponivel(): void {
  executarGh(['auth', 'status']);
}

export function listarIssuesCandidatas(limite = 100): IssueGitHub[] {
  return executarGhJson([
    'issue',
    'list',
    '--state',
    'open',
    '--label',
    LABEL_EXECUCAO_SANDCASTLE,
    '--limit',
    String(limite),
    '--json',
    'number,title,body,state,createdAt,updatedAt',
  ]) as IssueGitHub[];
}

export function lerIssue(numero: number): IssueGitHub {
  return executarGhJson([
    'issue',
    'view',
    String(numero),
    '--json',
    'number,title,body,state,createdAt,updatedAt',
  ]) as IssueGitHub;
}

export function lerComentariosIssue(numero: number): ComentarioGitHub[] {
  return executarGhJson([
    'api',
    `repos/:owner/:repo/issues/${String(numero)}/comments`,
    '--paginate',
    '--slurp',
    '--jq',
    'map(.[]) | map({id, body, createdAt: .created_at, updatedAt: .updated_at, author: {login: .user.login}})',
  ]) as ComentarioGitHub[];
}

export function criarComentarioIssue(numero: number, corpo: string): ComentarioGitHub {
  return executarGhJson([
    'api',
    `repos/:owner/:repo/issues/${String(numero)}/comments`,
    '--method',
    'POST',
    '--field',
    `body=${corpo}`,
    '--jq',
    '{id, body, createdAt: .created_at, updatedAt: .updated_at, author: {login: .user.login}}',
  ]) as ComentarioGitHub;
}

export function atualizarComentarioIssue(comentarioId: number | string, corpo: string): ComentarioGitHub {
  return executarGhJson([
    'api',
    `repos/:owner/:repo/issues/comments/${String(comentarioId)}`,
    '--method',
    'PATCH',
    '--field',
    `body=${corpo}`,
    '--jq',
    '{id, body, createdAt: .created_at, updatedAt: .updated_at, author: {login: .user.login}}',
  ]) as ComentarioGitHub;
}

export function procurarPrAbertaPorBranch(branch: string): PullRequestGitHub | null {
  const prs = executarGhJson([
    'pr',
    'list',
    '--state',
    'open',
    '--head',
    branch,
    '--json',
    'number,title,body,headRefName,state,url,mergedAt',
  ]) as PullRequestGitHub[];

  return prs[0] ?? null;
}

export function criarPullRequest(entrada: { branch: string; titulo: string; corpo: string }): PullRequestGitHub {
  const resultado = executarGh([
    'pr',
    'create',
    '--head',
    entrada.branch,
    '--title',
    entrada.titulo,
    '--body',
    entrada.corpo,
  ]);
  return lerPullRequest(resultado.stdout.trim());
}

export function consultarChecksPullRequest(numero: number): CheckPullRequestGitHub[] {
  return executarGhJson([
    'pr',
    'checks',
    String(numero),
    '--json',
    'name,state,conclusion,startedAt,completedAt,link',
  ]) as CheckPullRequestGitHub[];
}

function lerPullRequest(referencia: string): PullRequestGitHub {
  return executarGhJson([
    'pr',
    'view',
    referencia,
    '--json',
    'number,title,body,headRefName,state,url,mergedAt',
  ]) as PullRequestGitHub;
}

function executarGhJson(argumentos: string[]): unknown {
  const resultado = executarGh(argumentos);

  return JSON.parse(resultado.stdout) as unknown;
}

function executarGh(argumentos: string[]): ResultadoGh {
  const resultado = spawnSync('gh', argumentos, {
    encoding: 'utf8',
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (resultado.status !== 0) {
    throw new Error(formatarErroGh(argumentos, resultado));
  }

  return {
    stdout: resultado.stdout,
    stderr: resultado.stderr,
    status: resultado.status,
  };
}

function formatarErroGh(argumentos: string[], resultado: ResultadoGh): string {
  const comando = ['gh', ...argumentos].join(' ');
  const detalhe = resultado.stderr.trim() || resultado.stdout.trim() || 'sem detalhes do gh';

  return `Falha ao executar ${comando}: ${detalhe}`;
}
