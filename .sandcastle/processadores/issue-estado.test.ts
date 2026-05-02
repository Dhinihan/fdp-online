import { beforeEach, describe, expect, it, vi } from 'vitest';

const lerComentariosIssue = vi.fn();
const listarIssuesCandidatas = vi.fn();
const obterEstadoOperacionalIssue = vi.fn();

vi.mock('../github', () => ({
  LABEL_BLOQUEIO_SANDCASTLE: 'sandcastle:blocked',
  LABEL_EXECUCAO_SANDCASTLE: 'sandcastle:run',
  LABEL_EXECUTANDO_SANDCASTLE: 'sandcastle:running',
  LABEL_ESPERA_SANDCASTLE: 'sandcastle:waiting',
  adicionarLabelIssue: vi.fn(),
  lerComentariosIssue,
  lerIssue: vi.fn(),
  listarIssuesCandidatas,
  obterEstadoOperacionalIssue,
  removerLabelIssue: vi.fn(),
}));

vi.mock('../runner', () => ({
  lerArquivo: vi.fn(() => 'prompt-base'),
}));

beforeEach(() => {
  vi.clearAllMocks();
  obterEstadoOperacionalIssue.mockImplementation((issue: { labels?: { name: string }[] }) => {
    const labels = issue.labels?.map((label) => label.name) ?? [];

    if (labels.includes('sandcastle:blocked')) {
      return 'blocked';
    }

    if (labels.includes('sandcastle:running')) {
      return 'running';
    }

    if (labels.includes('sandcastle:waiting')) {
      return 'waiting';
    }

    if (labels.includes('sandcastle:run')) {
      return 'run';
    }

    return 'neutro';
  });
});

describe('elegibilidade de issues', () => {
  it('recusa item waiting mesmo se o runner tentar carregá-lo com run junto', async () => {
    const { adaptadorIssue } = await import('./issue');

    expect(
      adaptadorIssue.avaliarElegibilidade({
        number: 54,
        state: 'OPEN',
        labels: [{ name: 'sandcastle:run' }, { name: 'sandcastle:waiting' }],
      }),
    ).toContain('sandcastle:waiting');
  });
});
