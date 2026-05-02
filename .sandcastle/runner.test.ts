import { beforeEach, describe, expect, it, vi } from 'vitest';

const validarGhDisponivel = vi.fn();
const validarAutenticacaoCodex = vi.fn();
const validarAutenticacaoPi = vi.fn();
const validarDocker = vi.fn();

vi.mock('./github', () => ({
  validarGhDisponivel,
}));

vi.mock('./execucao-sandcastle', () => ({
  validarAutenticacaoCodex,
  validarAutenticacaoPi,
  validarDocker,
  formatarResultadoAgente: vi.fn(),
  rodarAgenteSandcastle: vi.fn(),
}));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  delete process.env.SANDCASTLE_AGENT;
});

describe('dry run do runner', () => {
  it('no dry run valida GitHub e Docker sem exigir autenticacao do agente', async () => {
    const { executarRunner } = await import('./runner');

    await executarRunner({ adaptadores: [], dryRun: true });

    expect(validarGhDisponivel).toHaveBeenCalledOnce();
    expect(validarDocker).toHaveBeenCalledOnce();
    expect(validarAutenticacaoCodex).not.toHaveBeenCalled();
    expect(validarAutenticacaoPi).not.toHaveBeenCalled();
  });
});

describe('execucao real com codex', () => {
  it('na execucao real valida autenticacao apenas do agente codex ativo', async () => {
    const { executarRunner } = await import('./runner');

    await executarRunner({ adaptadores: [], dryRun: false });

    expect(validarGhDisponivel).toHaveBeenCalledOnce();
    expect(validarDocker).toHaveBeenCalledOnce();
    expect(validarAutenticacaoCodex).toHaveBeenCalledOnce();
    expect(validarAutenticacaoPi).not.toHaveBeenCalled();
  });
});

describe('execucao real com pi', () => {
  it('na execucao real valida autenticacao apenas do agente pi ativo', async () => {
    process.env.SANDCASTLE_AGENT = 'pi';
    const { executarRunner } = await import('./runner');

    await executarRunner({ adaptadores: [], dryRun: false });

    expect(validarGhDisponivel).toHaveBeenCalledOnce();
    expect(validarDocker).toHaveBeenCalledOnce();
    expect(validarAutenticacaoPi).toHaveBeenCalledOnce();
    expect(validarAutenticacaoCodex).not.toHaveBeenCalled();
  });
});
