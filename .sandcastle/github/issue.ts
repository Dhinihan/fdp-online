import { executarGh, executarGhJson, executarGhSemErro, type ResultadoGh } from './base';

export const LABEL_EXECUCAO_SANDCASTLE = 'sandcastle:run';
export const LABEL_EXECUTANDO_SANDCASTLE = 'sandcastle:running';
export const LABEL_BLOQUEIO_SANDCASTLE = 'sandcastle:blocked';

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
    comments: ComentarioGitHub[];
  };

  return issue.comments;
}

export function removerLabelIssue(numero: number, label: string): void {
  const resultado = executarGhSemErro(['issue', 'edit', String(numero), '--remove-label', label]);

  if (resultado.status !== 0 && !erroLabelAusente(resultado)) {
    throw new Error(`Falha ao remover label ${label} da issue #${String(numero)}.`);
  }
}

export function adicionarLabelIssue(numero: number, label: string): void {
  executarGh(['issue', 'edit', String(numero), '--add-label', label]);
}

function erroLabelAusente(resultado: ResultadoGh): boolean {
  const detalhe = `${resultado.stderr}\n${resultado.stdout}`.toLowerCase();

  return detalhe.includes('404') || detalhe.includes('does not exist') || detalhe.includes('not found');
}
