import { beforeEach, describe, expect, it, vi } from 'vitest';

const adicionarLabelIssue = vi.fn();
const comentarIssue = vi.fn();
const issueEhPullRequest = vi.fn();
const lerComentariosIssue = vi.fn();
const lerIssue = vi.fn();
const listarIssuesEmEspera = vi.fn();
const listarIssuesCandidatas = vi.fn();
const obterEstadoOperacionalIssue = vi.fn();
const removerLabelIssue = vi.fn();

vi.mock('../github', () => ({
  LABEL_BLOQUEIO_SANDCASTLE: 'sandcastle:blocked',
  LABEL_EXECUCAO_SANDCASTLE: 'sandcastle:run',
  LABEL_EXECUTANDO_SANDCASTLE: 'sandcastle:running',
  LABEL_ESPERA_SANDCASTLE: 'sandcastle:waiting',
  adicionarLabelIssue,
  comentarIssue,
  issueEhPullRequest,
  lerComentariosIssue,
  lerIssue,
  listarIssuesEmEspera,
  listarIssuesCandidatas,
  obterEstadoOperacionalIssue,
  removerLabelIssue,
}));

vi.mock('../runner', () => ({
  lerArquivo: vi.fn(() => 'prompt-base'),
}));

beforeEach(() => {
  vi.clearAllMocks();
  issueEhPullRequest.mockReturnValue(false);
  obterEstadoOperacionalIssue.mockImplementation(calcularEstadoOperacional);
});

function calcularEstadoOperacional(issue: { labels?: { name: string }[] }) {
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
}

function mockIssueEmEspera(body = '## Blocked by\n\n- #50\n- #49\n', labels = ['sandcastle:waiting']) {
  listarIssuesEmEspera.mockReturnValue([
    {
      number: 51,
      body,
      labels: labels.map((name) => ({ name })),
    },
  ]);
}

function mockIssueEmEsperaComSubsecao() {
  mockIssueEmEspera('## Blocked by\n\n- #50\n\n### Contexto\n\n- #49\n');
}

async function importarReavaliacao() {
  const { listarDryRunIssuesEmEspera, reavaliarIssuesEmEspera } = await import('./reavaliacao-issue');

  return { listarDryRunIssuesEmEspera, reavaliarIssuesEmEspera };
}

function esperarIssueEmEspera() {
  expect(removerLabelIssue).not.toHaveBeenCalled();
  expect(adicionarLabelIssue).not.toHaveBeenCalled();
  expect(comentarIssue).not.toHaveBeenCalled();
}

function esperarBloqueioManual(numero: number, motivo: string) {
  expect(comentarIssue).toHaveBeenCalledOnce();
  expect(adicionarLabelIssue).toHaveBeenCalledWith(numero, 'sandcastle:blocked');
  expect(removerLabelIssue).toHaveBeenCalledWith(numero, 'sandcastle:waiting');
  expect(removerLabelIssue).toHaveBeenCalledWith(numero, 'sandcastle:run');
  expect(comentarIssue.mock.calls[0][1]).toContain('Bloqueio manual aplicado');
  expect(comentarIssue.mock.calls[0][1]).toContain(motivo);
}

describe('reavaliacao de issues em espera', () => {
  it('reativa a issue quando todos os bloqueadores estao fechados', async () => {
    mockIssueEmEspera();
    lerIssue.mockImplementation((numero: number) => ({
      number: numero,
      state: 'CLOSED',
    }));

    const { reavaliarIssuesEmEspera } = await importarReavaliacao();
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

    const { reavaliarIssuesEmEspera } = await importarReavaliacao();
    reavaliarIssuesEmEspera();

    esperarIssueEmEspera();
  });

  it('nao altera issue em espera que tambem esteja em execucao', async () => {
    mockIssueEmEspera('## Blocked by\n\n- #10', ['sandcastle:waiting', 'sandcastle:running']);
    const { reavaliarIssuesEmEspera } = await importarReavaliacao();
    reavaliarIssuesEmEspera();
    esperarIssueEmEspera();
  });

  it('nao reativa issue em espera quando ela tambem esta bloqueada manualmente', async () => {
    mockIssueEmEspera('## Blocked by\n\n- #10', ['sandcastle:waiting', 'sandcastle:blocked']);
    lerIssue.mockReturnValue({ number: 10, state: 'CLOSED' });
    const { reavaliarIssuesEmEspera } = await importarReavaliacao();
    reavaliarIssuesEmEspera();
    esperarIssueEmEspera();
  });
});

describe('reavaliacao com bloqueador nao legivel', () => {
  it('mantem a issue em espera quando um bloqueador nao pode ser lido por erro generico', async () => {
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

    const { reavaliarIssuesEmEspera } = await importarReavaliacao();
    expect(() => {
      reavaliarIssuesEmEspera();
    }).not.toThrow();
    esperarIssueEmEspera();
  });
});

describe('reavaliacao com blocked by ausente ou valido', () => {
  it('bloqueia manualmente quando a secao blocked by esta ausente', async () => {
    mockIssueEmEspera('## What to build\n\ntexto');
    const { reavaliarIssuesEmEspera } = await importarReavaliacao();
    reavaliarIssuesEmEspera();
    esperarBloqueioManual(51, 'secao `## Blocked by` ausente');
    expect(comentarIssue.mock.invocationCallOrder[0]).toBeLessThan(adicionarLabelIssue.mock.invocationCallOrder[0]);
  });

  it('mantem em espera quando blocked by e valido e bloqueador ainda aberto', async () => {
    mockIssueEmEspera('## Blocked by\n\n- #10');
    lerIssue.mockReturnValue({ number: 10, state: 'OPEN' });
    const { reavaliarIssuesEmEspera } = await importarReavaliacao();
    reavaliarIssuesEmEspera();
    esperarIssueEmEspera();
  });

  it('reativa a issue quando blocked by valido usa referencia sem bullet', async () => {
    mockIssueEmEspera('## Blocked by\n\n#10');
    lerIssue.mockReturnValue({ number: 10, state: 'CLOSED' });
    const { reavaliarIssuesEmEspera } = await importarReavaliacao();
    reavaliarIssuesEmEspera();
    expect(removerLabelIssue).toHaveBeenCalledWith(51, 'sandcastle:waiting');
    expect(adicionarLabelIssue).toHaveBeenCalledWith(51, 'sandcastle:run');
  });
});

describe('reavaliacao com dependencia inexistente ou erro operacional', () => {
  it('bloqueia manualmente quando a dependencia nao existe (404)', async () => {
    mockIssueEmEspera('## Blocked by\n\n- #10');
    lerIssue.mockImplementation(() => {
      throw new Error('Falha ao executar gh issue view 10 --json ...: HTTP 404 Not Found');
    });
    const { reavaliarIssuesEmEspera } = await importarReavaliacao();
    reavaliarIssuesEmEspera();
    esperarBloqueioManual(51, 'referencia #10 que nao pode ser lida como issue');
  });

  it('mantem em espera quando ocorre erro operacional ao reler dependencia', async () => {
    mockIssueEmEspera('## Blocked by\n\n- #10');
    lerIssue.mockImplementation(() => {
      throw new Error('Falha ao executar gh issue view 10 --json ...: rate limit exceeded');
    });
    const { reavaliarIssuesEmEspera } = await importarReavaliacao();
    expect(() => {
      reavaliarIssuesEmEspera();
    }).not.toThrow();
    esperarIssueEmEspera();
  });
});

describe('reavaliacao com subsecoes apos blocked by', () => {
  it('ignora bullets apos qualquer heading markdown', async () => {
    mockIssueEmEsperaComSubsecao();
    lerIssue.mockImplementation((numero: number) => ({
      number: numero,
      state: numero === 50 ? 'CLOSED' : 'OPEN',
    }));

    const { reavaliarIssuesEmEspera } = await importarReavaliacao();
    reavaliarIssuesEmEspera();

    expect(removerLabelIssue).toHaveBeenCalledWith(51, 'sandcastle:waiting');
    expect(adicionarLabelIssue).toHaveBeenCalledWith(51, 'sandcastle:run');
  });
});
