import { beforeEach, describe, expect, it, vi } from 'vitest';

const adicionarLabelIssue = vi.fn();
const lerComentariosIssue = vi.fn();
const lerIssue = vi.fn();
const listarIssuesCandidatas = vi.fn();
const listarIssuesEmEspera = vi.fn();
const removerLabelIssue = vi.fn();

vi.mock('../github', () => ({
  LABEL_BLOQUEIO_SANDCASTLE: 'sandcastle:blocked',
  LABEL_EXECUCAO_SANDCASTLE: 'sandcastle:run',
  LABEL_EXECUTANDO_SANDCASTLE: 'sandcastle:running',
  LABEL_ESPERA_SANDCASTLE: 'sandcastle:waiting',
  adicionarLabelIssue,
  lerComentariosIssue,
  lerIssue,
  listarIssuesCandidatas,
  listarIssuesEmEspera,
  removerLabelIssue,
}));

vi.mock('../runner', () => ({
  lerArquivo: vi.fn(() => 'prompt-base'),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function mockIssueEmEspera() {
  listarIssuesEmEspera.mockReturnValue([
    {
      number: 51,
      body: '## Blocked by\n\n- #50\n- #49\n',
    },
  ]);
}

async function importarReavaliacao() {
  const { reavaliarIssuesEmEspera } = await import('./issue');

  return reavaliarIssuesEmEspera;
}

function esperarIssueEmEspera() {
  expect(removerLabelIssue).not.toHaveBeenCalled();
  expect(adicionarLabelIssue).not.toHaveBeenCalled();
}

describe('reavaliacao de issues em espera', () => {
  it('reativa a issue quando todos os bloqueadores estao fechados', async () => {
    mockIssueEmEspera();
    lerIssue.mockImplementation((numero: number) => ({
      number: numero,
      state: 'CLOSED',
    }));

    const reavaliarIssuesEmEspera = await importarReavaliacao();

    reavaliarIssuesEmEspera();

    expect(removerLabelIssue).toHaveBeenCalledWith(51, 'sandcastle:waiting');
    expect(adicionarLabelIssue).toHaveBeenCalledWith(51, 'sandcastle:run');
  });
});

describe('reavaliacao de issues ainda bloqueadas', () => {
  it('mantem a issue em espera quando ainda existe bloqueador aberto', async () => {
    mockIssueEmEspera();
    lerIssue.mockImplementation((numero: number) => ({
      number: numero,
      state: numero === 50 ? 'OPEN' : 'CLOSED',
    }));

    const reavaliarIssuesEmEspera = await importarReavaliacao();

    reavaliarIssuesEmEspera();

    esperarIssueEmEspera();
  });
});

describe('reavaliacao com bloqueador invalido', () => {
  it('mantem a issue em espera quando um bloqueador nao pode ser lido', async () => {
    mockIssueEmEspera();
    lerIssue.mockImplementation((numero: number) => {
      if (numero === 50) {
        throw new Error('issue nao encontrada');
      }

      return {
        number: numero,
        state: 'CLOSED',
      };
    });

    const reavaliarIssuesEmEspera = await importarReavaliacao();

    expect(() => {
      reavaliarIssuesEmEspera();
    }).not.toThrow();
    esperarIssueEmEspera();
  });
});
