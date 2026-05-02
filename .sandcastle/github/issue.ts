import { executarGh, executarGhJson, executarGhSemErro, type ResultadoGh } from './base';

export const LABEL_EXECUCAO_SANDCASTLE = 'sandcastle:run';
export const LABEL_EXECUTANDO_SANDCASTLE = 'sandcastle:running';
export const LABEL_BLOQUEIO_SANDCASTLE = 'sandcastle:blocked';
export const LABEL_ESPERA_SANDCASTLE = 'sandcastle:waiting';
const TITULO_SECAO_BLOCKED_BY = '## Blocked by';

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

export function listarIssuesEmEspera(limite = 100): IssueGitHub[] {
  return executarGhJson([
    'issue',
    'list',
    '--state',
    'open',
    '--label',
    LABEL_ESPERA_SANDCASTLE,
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

export function atualizarCorpoIssue(numero: number, corpo: string): void {
  executarGh(['issue', 'edit', String(numero), '--body', corpo]);
}

export function atualizarIssueComDependencias(numero: number, corpoAtual: string, dependencias: number[]): void {
  atualizarCorpoIssue(numero, atualizarSecaoBlockedBy(corpoAtual, dependencias));
}

export function atualizarSecaoBlockedBy(corpoAtual: string, dependencias: number[]): string {
  const secoes = separarSecaoBlockedBy(corpoAtual);
  const secao = montarSecaoBlockedBy(dependencias);

  if (secoes) {
    return [secoes.antes.trimEnd(), secao, secoes.depois.trimStart()]
      .filter((trecho) => trecho.length > 0)
      .join('\n\n');
  }

  return [corpoAtual.trimEnd(), secao].filter((trecho) => trecho.length > 0).join('\n\n');
}

function montarSecaoBlockedBy(dependencias: number[]): string {
  const itens = normalizarDependencias(dependencias).map((dependencia) => `- #${String(dependencia)}`);

  return [TITULO_SECAO_BLOCKED_BY, '', itens.join('\n') || 'None - can start immediately'].join('\n');
}

function normalizarDependencias(dependencias: number[]): number[] {
  return [...new Set(dependencias)].sort((primeira, segunda) => primeira - segunda);
}

function separarSecaoBlockedBy(corpoAtual: string): { antes: string; depois: string } | null {
  const linhas = corpoAtual.split('\n');
  const indiceInicio = linhas.findIndex((linha) => linha.trim() === TITULO_SECAO_BLOCKED_BY);

  if (indiceInicio < 0) {
    return null;
  }

  const indiceFim = encontrarFimSecao(linhas, indiceInicio + 1);

  return {
    antes: linhas.slice(0, indiceInicio).join('\n'),
    depois: linhas.slice(indiceFim).join('\n'),
  };
}

function encontrarFimSecao(linhas: string[], inicioBusca: number): number {
  for (let indice = inicioBusca; indice < linhas.length; indice += 1) {
    if (ehTituloMarkdown(linhas[indice])) {
      return indice;
    }
  }

  return linhas.length;
}

function ehTituloMarkdown(linha: string): boolean {
  return /^#{1,6}\s+/.test(linha.trim());
}

export function comentarIssue(numero: number, comentario: string): void {
  executarGh(['issue', 'comment', String(numero), '--body', comentario]);
}

export function issueEhPullRequest(numero: number): boolean {
  const resultado = executarGhSemErro(['pr', 'view', String(numero), '--json', 'number']);

  return resultado.status === 0;
}

function erroLabelAusente(resultado: ResultadoGh): boolean {
  const detalhe = `${resultado.stderr}\n${resultado.stdout}`.toLowerCase();

  return detalhe.includes('404') || detalhe.includes('does not exist') || detalhe.includes('not found');
}
