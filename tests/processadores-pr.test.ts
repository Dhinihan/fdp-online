import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PullRequestGitHub } from '../.sandcastle/github/pr';
import { adaptadorPr } from '../.sandcastle/processadores/pr';

const { spawnSync } = vi.hoisted(() => ({
  spawnSync: vi.fn(),
}));

vi.mock('node:child_process', () => ({
  spawnSync,
}));

function criarPullRequest(parcial?: Partial<PullRequestGitHub>): PullRequestGitHub {
  return {
    number: 32,
    title: 'PR de teste',
    state: 'OPEN',
    createdAt: '2026-05-01T00:00:00Z',
    headRefName: 'sandcastle-pr',
    headRefOid: 'abc123',
    headRepositoryOwner: { login: 'Dhinihan' },
    isCrossRepository: false,
    reviewDecision: null,
    labels: [],
    ...parcial,
  };
}

beforeEach(() => {
  spawnSync.mockReset();
});

describe('adaptadorPr.obterBranch', () => {
  it('usa a ref remota e cria a branch local quando o head local nao existe', () => {
    prepararRespostasRefRemota();

    const branch = adaptadorPr.obterBranch(criarPullRequest());

    expect(branch).toBe('sandcastle-pr');
    validarChamadasRefRemota();
  });

  it('falha quando nenhuma ref local aponta para o head da PR', () => {
    spawnSync
      .mockReturnValueOnce({ status: 1, stdout: '', stderr: '' })
      .mockReturnValueOnce({ status: 0, stdout: 'sha-antigo\n', stderr: '' })
      .mockReturnValueOnce({ status: 1, stdout: '', stderr: '' });

    expect(() => adaptadorPr.obterBranch(criarPullRequest())).toThrow(
      'Busque uma ref local, remota ou refs/pull/*/head apontando para o head exato da PR antes de rodar o agente.',
    );
  });
});

function prepararRespostasRefRemota(): void {
  spawnSync
    .mockReturnValueOnce({ status: 1, stdout: '', stderr: '' })
    .mockReturnValueOnce({ status: 0, stdout: 'abc123\n', stderr: '' })
    .mockReturnValueOnce({ status: 0, stdout: 'abc123\n', stderr: '' })
    .mockReturnValueOnce({ status: 1, stdout: '', stderr: '' })
    .mockReturnValueOnce({ status: 0, stdout: '', stderr: '' });
}

function validarChamadasRefRemota(): void {
  expect(spawnSync).toHaveBeenNthCalledWith(
    1,
    'git',
    ['rev-parse', 'refs/heads/sandcastle-pr'],
    expect.objectContaining({ encoding: 'utf8' }),
  );
  expect(spawnSync).toHaveBeenNthCalledWith(
    2,
    'git',
    ['rev-parse', 'refs/remotes/origin/sandcastle-pr'],
    expect.objectContaining({ encoding: 'utf8' }),
  );
  expect(spawnSync).toHaveBeenNthCalledWith(
    5,
    'git',
    ['update-ref', 'refs/heads/sandcastle-pr', 'abc123'],
    expect.objectContaining({ encoding: 'utf8' }),
  );
}
