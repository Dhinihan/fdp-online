import { beforeEach, describe, expect, it, vi } from 'vitest';

const adicionarLabelIssue = vi.fn();
const comentarIssue = vi.fn();
const issueEhPullRequest = vi.fn();
const lerComentariosIssue = vi.fn();
const lerIssue = vi.fn();
const listarIssuesEmEspera = vi.fn();
const listarIssuesCandidatas = vi.fn();
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
  removerLabelIssue,
}));

vi.mock('../runner', () => ({
  lerArquivo: vi.fn(() => 'prompt-base'),
}));

beforeEach(() => {
  vi.clearAllMocks();
  issueEhPullRequest.mockReturnValue(false);
});

function mockIssueEmEspera(body = '## Blocked by\n\n- #50\n- #49\n') {
  listarIssuesEmEspera.mockReturnValue([
    {
      number: 51,
      body,
    },
  ]);
}

function mockIssueEmEsperaComSubsecao() {
  mockIssueEmEspera('## Blocked by\n\n- #50\n\n### Contexto\n\n- #49\n');
}

async function importarReavaliacao() {
  const { reavaliarIssuesEmEspera } = await import('./issue');

  return reavaliarIssuesEmEspera;
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

    const reavaliar = await importarReavaliacao();
    reavaliar();

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

    const reavaliar = await importarReavaliacao();
    reavaliar();

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

    const reavaliar = await importarReavaliacao();
    expect(() => {
      reavaliar();
    }).not.toThrow();
    esperarIssueEmEspera();
  });
});

describe('reavaliacao com blocked by ausente ou valido', () => {
  it('bloqueia manualmente quando a secao blocked by esta ausente', async () => {
    mockIssueEmEspera('## What to build\n\ntexto');
    const reavaliar = await importarReavaliacao();
    reavaliar();
    esperarBloqueioManual(51, 'secao `## Blocked by` ausente');
    expect(comentarIssue.mock.invocationCallOrder[0]).toBeLessThan(adicionarLabelIssue.mock.invocationCallOrder[0]);
  });

  it('mantem em espera quando blocked by e valido e bloqueador ainda aberto', async () => {
    mockIssueEmEspera('## Blocked by\n\n- #10');
    lerIssue.mockReturnValue({ number: 10, state: 'OPEN' });
    const reavaliar = await importarReavaliacao();
    reavaliar();
    esperarIssueEmEspera();
  });

  it('reativa a issue quando blocked by valido usa referencia sem bullet', async () => {
    mockIssueEmEspera('## Blocked by\n\n#10');
    lerIssue.mockReturnValue({ number: 10, state: 'CLOSED' });
    const reavaliar = await importarReavaliacao();
    reavaliar();
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
    const reavaliar = await importarReavaliacao();
    reavaliar();
    esperarBloqueioManual(51, 'referencia #10 que nao pode ser lida como issue');
  });

  it('mantem em espera quando ocorre erro operacional ao reler dependencia', async () => {
    mockIssueEmEspera('## Blocked by\n\n- #10');
    lerIssue.mockImplementation(() => {
      throw new Error('Falha ao executar gh issue view 10 --json ...: rate limit exceeded');
    });
    const reavaliar = await importarReavaliacao();
    expect(() => {
      reavaliar();
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

    const reavaliar = await importarReavaliacao();
    reavaliar();

    expect(removerLabelIssue).toHaveBeenCalledWith(51, 'sandcastle:waiting');
    expect(adicionarLabelIssue).toHaveBeenCalledWith(51, 'sandcastle:run');
  });
});
