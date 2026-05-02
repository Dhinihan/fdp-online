import { beforeEach, expect, it, vi } from 'vitest';

const { executarGh, executarGhJson, executarGhSemErro } = vi.hoisted(() => ({
  executarGh: vi.fn(),
  executarGhJson: vi.fn(),
  executarGhSemErro: vi.fn(),
}));

vi.mock('./base', () => ({
  executarGh,
  executarGhJson,
  executarGhSemErro,
}));

const CORPO_BASE = [
  '## What to build',
  '',
  'Implementar o fluxo.',
  '',
  '## Acceptance criteria',
  '',
  '- [ ] Funciona',
].join('\n');
const CORPO_COM_BLOCKED_BY = [
  '## What to build',
  '',
  'Implementar o fluxo.',
  '',
  '## Blocked by',
  '',
  '- #40',
  '',
  '## Acceptance criteria',
  '',
  '- [ ] Funciona',
].join('\n');
const CORPO_ESPERADO_COM_NOVA_SECAO = [
  '## What to build',
  '',
  'Implementar o fluxo.',
  '',
  '## Acceptance criteria',
  '',
  '- [ ] Funciona',
  '',
  '## Blocked by',
  '',
  '- #49',
  '- #52',
].join('\n');
const CORPO_ESPERADO_COM_SECAO_ATUALIZADA = [
  '## What to build',
  '',
  'Implementar o fluxo.',
  '',
  '## Blocked by',
  '',
  '- #52',
  '',
  '## Acceptance criteria',
  '',
  '- [ ] Funciona',
].join('\n');
const CORPO_COM_SUBTITULO_APOS_BLOCKED_BY = [
  '## What to build',
  '',
  'Implementar o fluxo.',
  '',
  '## Blocked by',
  '',
  '- #40',
  '',
  '### Contexto adicional',
  '',
  'Nao remover este trecho.',
].join('\n');
const CORPO_ESPERADO_COM_SUBTITULO_PRESERVADO = [
  '## What to build',
  '',
  'Implementar o fluxo.',
  '',
  '## Blocked by',
  '',
  '- #52',
  '',
  '### Contexto adicional',
  '',
  'Nao remover este trecho.',
].join('\n');

async function importarModuloIssue() {
  return import('./issue');
}

it('cria a secao no fim do corpo quando ela nao existe', () => {
  return importarModuloIssue().then(({ atualizarSecaoBlockedBy }) => {
    expect(atualizarSecaoBlockedBy(CORPO_BASE, [49, 52])).toBe(CORPO_ESPERADO_COM_NOVA_SECAO);
  });
});

it('atualiza a secao existente sem duplicar o titulo', () => {
  return importarModuloIssue().then(({ atualizarSecaoBlockedBy }) => {
    expect(atualizarSecaoBlockedBy(CORPO_COM_BLOCKED_BY, [52])).toBe(CORPO_ESPERADO_COM_SECAO_ATUALIZADA);
  });
});

it('preserva o restante do corpo ao encontrar subtitulos markdown apos a secao', () => {
  return importarModuloIssue().then(({ atualizarSecaoBlockedBy }) => {
    expect(atualizarSecaoBlockedBy(CORPO_COM_SUBTITULO_APOS_BLOCKED_BY, [52])).toBe(
      CORPO_ESPERADO_COM_SUBTITULO_PRESERVADO,
    );
  });
});

it('normaliza dependencias repetidas e ordena as referencias', () => {
  return importarModuloIssue().then(({ atualizarSecaoBlockedBy }) => {
    expect(atualizarSecaoBlockedBy('', [52, 49, 52])).toBe(['## Blocked by', '', '- #49', '- #52'].join('\n'));
  });
});

beforeEach(() => {
  vi.clearAllMocks();
});

it('prioriza blocked sobre running, waiting e run', () => {
  return importarModuloIssue().then(({ obterEstadoOperacionalIssue }) => {
    expect(
      obterEstadoOperacionalIssue({
        labels: [
          { name: 'sandcastle:run' },
          { name: 'sandcastle:waiting' },
          { name: 'sandcastle:running' },
          { name: 'sandcastle:blocked' },
        ],
      }),
    ).toBe('blocked');
  });
});

it('lista como candidatas apenas issues efetivamente em run', () => {
  executarGhJson.mockReturnValue([
    { number: 1, labels: [{ name: 'sandcastle:run' }] },
    { number: 2, labels: [{ name: 'sandcastle:run' }, { name: 'sandcastle:waiting' }] },
    { number: 3, labels: [{ name: 'sandcastle:run' }, { name: 'sandcastle:blocked' }] },
  ]);

  return importarModuloIssue().then(({ listarIssuesCandidatas }) => {
    expect(listarIssuesCandidatas()).toEqual([{ number: 1, labels: [{ name: 'sandcastle:run' }] }]);
  });
});

it('lista como waiting apenas issues sem conflito com blocked ou running', () => {
  executarGhJson.mockReturnValue([
    { number: 1, labels: [{ name: 'sandcastle:waiting' }] },
    { number: 2, labels: [{ name: 'sandcastle:waiting' }, { name: 'sandcastle:running' }] },
    { number: 3, labels: [{ name: 'sandcastle:waiting' }, { name: 'sandcastle:blocked' }] },
  ]);

  return importarModuloIssue().then(({ listarIssuesEmEspera }) => {
    expect(listarIssuesEmEspera()).toEqual([{ number: 1, labels: [{ name: 'sandcastle:waiting' }] }]);
  });
});

it('retorna true quando o numero existe como PR', () => {
  executarGhSemErro.mockReturnValue({ status: 0, stdout: '{"number":79,"title":"feat"}', stderr: '' });

  return importarModuloIssue().then(({ issueEhPullRequest }) => {
    expect(issueEhPullRequest(79)).toBe(true);
  });
});

it('retorna false quando o numero existe como issue mas nao como PR', () => {
  executarGhSemErro.mockReturnValue({ status: 1, stdout: '', stderr: 'GraphQL: Could not resolve...' });

  return importarModuloIssue().then(({ issueEhPullRequest }) => {
    expect(issueEhPullRequest(75)).toBe(false);
  });
});

it('retorna false quando o numero nao existe', () => {
  executarGhSemErro.mockReturnValue({ status: 1, stdout: '', stderr: 'GraphQL: Could not resolve...' });

  return importarModuloIssue().then(({ issueEhPullRequest }) => {
    expect(issueEhPullRequest(99999)).toBe(false);
  });
});
