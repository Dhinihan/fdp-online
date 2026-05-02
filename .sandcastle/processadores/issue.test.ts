import { beforeEach, describe, expect, it, vi } from 'vitest';

const adicionarLabelIssue = vi.fn();
const comentarIssue = vi.fn();
const issueEhPullRequest = vi.fn();
const lerComentariosIssue = vi.fn();
const lerIssue = vi.fn();
const listarIssuesAguardando = vi.fn();
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
  listarIssuesAguardando,
  listarIssuesCandidatas,
  removerLabelIssue,
}));

vi.mock('../runner', () => ({
  lerArquivo: vi.fn(() => 'prompt'),
}));

function criarIssueAguardando(body: string) {
  return {
    number: 52,
    title: 'issue aguardando',
    body,
    state: 'OPEN' as const,
    createdAt: '2026-05-02T00:00:00Z',
    updatedAt: '2026-05-02T00:00:00Z',
    labels: [{ name: 'sandcastle:waiting' }],
  };
}

async function importarAdaptador() {
  const { adaptadorIssue } = await import('./issue');

  return adaptadorIssue;
}

async function listarElegiveis(body: string) {
  listarIssuesAguardando.mockReturnValue([criarIssueAguardando(body)]);
  const adaptadorIssue = await importarAdaptador();

  return adaptadorIssue.listarElegiveis();
}

function prepararMocksBase(): void {
  vi.resetModules();
  vi.clearAllMocks();
  issueEhPullRequest.mockReturnValue(false);
  lerIssue.mockReturnValue({
    number: 10,
    title: 'dependencia',
    body: '',
    state: 'OPEN',
    createdAt: '2026-05-02T00:00:00Z',
    updatedAt: '2026-05-02T00:00:00Z',
    labels: [],
  });
  listarIssuesCandidatas.mockReturnValue([]);
}

function esperarBloqueioManual(motivo: string): void {
  expect(comentarIssue).toHaveBeenCalledOnce();
  expect(adicionarLabelIssue).toHaveBeenCalledWith(52, 'sandcastle:blocked');
  expect(removerLabelIssue).toHaveBeenCalledWith(52, 'sandcastle:waiting');
  expect(removerLabelIssue).toHaveBeenCalledWith(52, 'sandcastle:run');
  expect(comentarIssue.mock.calls[0][1]).toContain('Bloqueio manual aplicado');
  expect(comentarIssue.mock.calls[0][1]).toContain(motivo);
}

function esperarSemMutacao(): void {
  expect(adicionarLabelIssue).not.toHaveBeenCalled();
  expect(removerLabelIssue).not.toHaveBeenCalled();
  expect(comentarIssue).not.toHaveBeenCalled();
}

describe('adaptadorIssue', () => {
  beforeEach(prepararMocksBase);

  it('converte issue em waiting com Blocked by invalido para blocked e comenta o motivo', async () => {
    expect(await listarElegiveis('## What to build\n\ntexto')).toEqual([]);
    esperarBloqueioManual('secao `## Blocked by` ausente');
    expect(comentarIssue.mock.invocationCallOrder[0]).toBeLessThan(adicionarLabelIssue.mock.invocationCallOrder[0]);
  });

  it('mantem issue em waiting quando o Blocked by e valido', async () => {
    expect(await listarElegiveis('## Blocked by\n\n- #10')).toEqual([]);
    esperarSemMutacao();
  });

  it('converte issue em waiting para blocked quando a dependencia nao existe', async () => {
    lerIssue.mockImplementation(() => {
      throw new Error('Falha ao executar gh issue view 10 --json ...: HTTP 404 Not Found');
    });

    expect(await listarElegiveis('## Blocked by\n\n- #10')).toEqual([]);
    esperarBloqueioManual('referencia #10 que nao pode ser lida como issue');
  });

  it('propaga erro operacional ao reler dependencia de waiting', async () => {
    lerIssue.mockImplementation(() => {
      throw new Error('Falha ao executar gh issue view 10 --json ...: rate limit exceeded');
    });

    await expect(listarElegiveis('## Blocked by\n\n- #10')).rejects.toThrow('rate limit exceeded');
    esperarSemMutacao();
  });
});
