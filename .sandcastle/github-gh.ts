import { spawnSync } from 'node:child_process';

export const LABEL_EXECUCAO_SANDCASTLE = 'sandcastle:run';
export const LABEL_EXECUTANDO_SANDCASTLE = 'sandcastle:running';

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
  labels: { name: string }[];
}

export interface ComentarioGitHub {
  id: number;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: { login: string };
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
    'number,title,body,state,createdAt,updatedAt,labels',
  ]) as IssueGitHub[];
}

export function lerIssue(numero: number): IssueGitHub {
  return executarGhJson([
    'issue',
    'view',
    String(numero),
    '--json',
    'number,title,body,state,createdAt,updatedAt,labels',
  ]) as IssueGitHub;
}

export function lerComentariosIssue(numero: number): ComentarioGitHub[] {
  const issue = executarGhJson(['issue', 'view', String(numero), '--json', 'comments']) as {
    comments: {
      id: number;
      body: string;
      createdAt: string;
      updatedAt: string;
      author: { login: string };
    }[];
  };

  return issue.comments;
}

export function removerLabelIssue(numero: number, label: string): void {
  const resultado = executarGhSemErro(['issue', 'edit', String(numero), '--remove-label', label]);

  if (resultado.status !== 0 && !erroLabelAusente(resultado)) {
    throw new Error(formatarErroGh(['issue', 'edit', String(numero), '--remove-label', label], resultado));
  }
}

export function adicionarLabelIssue(numero: number, label: string): void {
  executarGh(['issue', 'edit', String(numero), '--add-label', label]);
}

function executarGhJson(argumentos: string[]): unknown {
  const resultado = executarGh(argumentos);

  return JSON.parse(resultado.stdout) as unknown;
}

function executarGh(argumentos: string[]): ResultadoGh {
  const resultado = executarGhSemErro(argumentos);

  if (resultado.status !== 0) {
    throw new Error(formatarErroGh(argumentos, resultado));
  }

  return resultado;
}

function executarGhSemErro(argumentos: string[]): ResultadoGh {
  const resultado = spawnSync('gh', argumentos, {
    encoding: 'utf8',
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  return {
    stdout: resultado.stdout,
    stderr: resultado.stderr,
    status: resultado.status,
  };
}

function erroLabelAusente(resultado: ResultadoGh): boolean {
  const detalhe = `${resultado.stderr}\n${resultado.stdout}`.toLowerCase();

  return detalhe.includes('404') || detalhe.includes('does not exist') || detalhe.includes('not found');
}

function formatarErroGh(argumentos: string[], resultado: ResultadoGh): string {
  const comando = ['gh', ...argumentos].join(' ');
  const detalhe = resultado.stderr.trim() || resultado.stdout.trim() || 'sem detalhes do gh';

  return `Falha ao executar ${comando}: ${detalhe}`;
}
