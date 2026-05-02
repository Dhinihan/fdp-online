import { beforeEach, expect, it, vi } from 'vitest';

const issueEhPullRequest = vi.fn();
const lerIssue = vi.fn();
const listarIssuesEmEspera = vi.fn();

vi.mock('../github', () => ({
  LABEL_BLOQUEIO_SANDCASTLE: 'sandcastle:blocked',
  LABEL_EXECUCAO_SANDCASTLE: 'sandcastle:run',
  LABEL_ESPERA_SANDCASTLE: 'sandcastle:waiting',
  adicionarLabelIssue: vi.fn(),
  comentarIssue: vi.fn(),
  issueEhPullRequest,
  lerIssue,
  listarIssuesEmEspera,
  removerLabelIssue: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  issueEhPullRequest.mockReturnValue(false);
});

function mockIssueEmEspera(body: string) {
  listarIssuesEmEspera.mockReturnValue([{ number: 51, body }]);
}

function esperarDryRunIssueEmEspera(linhas: string[]) {
  return [linhas.join('\n')];
}

it('mostra no dry run a reativacao esperada sem alterar labels', async () => {
  mockIssueEmEspera('## Blocked by\n\n- #10');
  lerIssue.mockReturnValue({ number: 10, state: 'CLOSED' });
  const { listarDryRunIssuesEmEspera } = await import('./reavaliacao-issue');

  expect(listarDryRunIssuesEmEspera()).toEqual(
    esperarDryRunIssueEmEspera([
      'DRY RUN: issue #51 em sandcastle:waiting.',
      'Resultado: voltaria para sandcastle:run.',
      'Motivo: todos os bloqueadores estao fechados.',
    ]),
  );
});

it('mostra no dry run quando a issue continua aguardando', async () => {
  mockIssueEmEspera('## Blocked by\n\n- #10');
  lerIssue.mockReturnValue({ number: 10, state: 'OPEN' });
  const { listarDryRunIssuesEmEspera } = await import('./reavaliacao-issue');

  expect(listarDryRunIssuesEmEspera()).toEqual(
    esperarDryRunIssueEmEspera([
      'DRY RUN: issue #51 em sandcastle:waiting.',
      'Resultado: continuaria em sandcastle:waiting.',
      'Motivo: ainda existe bloqueador aberto ou temporariamente indisponivel.',
    ]),
  );
});

it('mostra no dry run quando a issue viraria bloqueio manual', async () => {
  mockIssueEmEspera('## What to build\n\ntexto');
  const { listarDryRunIssuesEmEspera } = await import('./reavaliacao-issue');

  expect(listarDryRunIssuesEmEspera()).toEqual(
    esperarDryRunIssueEmEspera([
      'DRY RUN: issue #51 em sandcastle:waiting.',
      'Resultado: viraria sandcastle:blocked.',
      'Motivo: secao `## Blocked by` ausente.',
    ]),
  );
});
