import { executarGh, executarGhJson, executarGhSemErro, type ResultadoGh } from './base';

export const LABEL_REVISAO_SANDCASTLE = 'sandcastle:review';
export const LABEL_REVISANDO_SANDCASTLE = 'sandcastle:reviewing';

const QUERY_REVIEW_THREADS = `
  query($owner: String!, $repo: String!, $number: Int!, $cursor: String) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $number) {
        reviewThreads(first: 100, after: $cursor) {
          nodes { id isResolved isOutdated path line originalLine diffSide
            comments(first: 100) { nodes { id body createdAt url author { login } } }
          }
          pageInfo { hasNextPage endCursor }
        }
      }
    }
  }
`;

export interface PullRequestGitHub {
  number: number;
  title: string;
  state: 'OPEN' | 'CLOSED' | 'MERGED';
  createdAt: string;
  headRefName: string;
  reviewDecision: string | null;
  labels: { name: string }[];
}

export interface ComentarioThreadRevisaoGitHub {
  id: string;
  body: string;
  createdAt: string;
  url: string;
  author: { login: string };
}

export interface ThreadRevisaoGitHub {
  id: string;
  isResolved: boolean;
  isOutdated: boolean;
  path: string | null;
  line: number | null;
  originalLine: number | null;
  diffSide: string | null;
  comments: ComentarioThreadRevisaoGitHub[];
}

interface RepositorioGitHub {
  owner: string;
  repo: string;
}

interface RespostaGraphqlReviewThreads {
  data: {
    repository: {
      pullRequest: PullRequestGraphql | null;
    };
  };
}

interface PullRequestGraphql {
  reviewThreads: ReviewThreadsGraphql;
}

interface ReviewThreadsGraphql {
  nodes: ThreadRevisaoGraphql[];
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string | null;
  };
}

interface ThreadRevisaoGraphql {
  id: string;
  isResolved: boolean;
  isOutdated: boolean;
  path: string | null;
  line: number | null;
  originalLine: number | null;
  diffSide: string | null;
  comments: {
    nodes: ComentarioThreadRevisaoGitHub[];
  };
}

export function lerPullRequest(numero: number): PullRequestGitHub {
  return executarGhJson([
    'pr',
    'view',
    String(numero),
    '--json',
    'number,title,state,createdAt,headRefName,reviewDecision,labels',
  ]) as PullRequestGitHub;
}

export function listarPullRequestsCandidatas(limite = 100): PullRequestGitHub[] {
  return executarGhJson([
    'pr',
    'list',
    '--state',
    'open',
    '--label',
    LABEL_REVISAO_SANDCASTLE,
    '--limit',
    String(limite),
    '--json',
    'number,title,state,createdAt,headRefName,reviewDecision,labels',
  ]) as PullRequestGitHub[];
}

export function lerThreadsRevisaoPullRequest(numero: number): ThreadRevisaoGitHub[] {
  const repositorio = lerRepositorioAtual();
  const threads: ThreadRevisaoGitHub[] = [];
  let cursor: string | null = null;

  do {
    const reviewThreads = lerPaginaThreadsRevisao(numero, repositorio, cursor);

    if (!reviewThreads) {
      return [];
    }

    threads.push(...reviewThreads.nodes.map(normalizarThreadRevisao));
    cursor = reviewThreads.pageInfo.hasNextPage ? reviewThreads.pageInfo.endCursor : null;
  } while (cursor);

  return threads;
}

export function removerLabelPullRequest(numero: number, label: string): void {
  const resultado = executarGhSemErro(['pr', 'edit', String(numero), '--remove-label', label]);

  if (resultado.status !== 0 && !erroLabelAusente(resultado)) {
    throw new Error(`Falha ao remover label ${label} da PR #${String(numero)}.`);
  }
}

export function adicionarLabelPullRequest(numero: number, label: string): void {
  executarGh(['pr', 'edit', String(numero), '--add-label', label]);
}

function lerPaginaThreadsRevisao(
  numero: number,
  repositorio: RepositorioGitHub,
  cursor: string | null,
): ReviewThreadsGraphql | null {
  const resposta = executarGhJson(montarArgumentosGraphql(numero, repositorio, cursor)) as RespostaGraphqlReviewThreads;
  const pullRequest = resposta.data.repository.pullRequest;

  return pullRequest ? pullRequest.reviewThreads : null;
}

function montarArgumentosGraphql(numero: number, repositorio: RepositorioGitHub, cursor: string | null): string[] {
  return [
    'api',
    'graphql',
    '-f',
    `owner=${repositorio.owner}`,
    '-f',
    `repo=${repositorio.repo}`,
    '-F',
    `number=${String(numero)}`,
    ...(cursor ? ['-F', `cursor=${cursor}`] : []),
    '-f',
    `query=${QUERY_REVIEW_THREADS}`,
  ];
}

function lerRepositorioAtual(): RepositorioGitHub {
  const remoto = executarGh(['repo', 'view', '--json', 'nameWithOwner']);
  const repositorio = JSON.parse(remoto.stdout) as { nameWithOwner: string };
  const [owner, repo] = repositorio.nameWithOwner.split('/');

  if (!owner || !repo) {
    throw new Error('Nao foi possivel identificar o repositorio atual via gh repo view.');
  }

  return { owner, repo };
}

function normalizarThreadRevisao(thread: ThreadRevisaoGraphql): ThreadRevisaoGitHub {
  return {
    id: thread.id,
    isResolved: thread.isResolved,
    isOutdated: thread.isOutdated,
    path: thread.path,
    line: thread.line,
    originalLine: thread.originalLine,
    diffSide: thread.diffSide,
    comments: thread.comments.nodes,
  };
}

function erroLabelAusente(resultado: ResultadoGh): boolean {
  const detalhe = `${resultado.stderr}\n${resultado.stdout}`.toLowerCase();

  return detalhe.includes('404') || detalhe.includes('does not exist') || detalhe.includes('not found');
}
