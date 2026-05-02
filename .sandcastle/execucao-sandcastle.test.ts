import type { RunResult } from '@ai-hero/sandcastle';
import { describe, expect, it, vi } from 'vitest';
import { formatarResultadoAgente } from './execucao-sandcastle';

describe('formatarResultadoAgente', () => {
  it('inclui agente e modelo de forma concisa no resultado do item', () => {
    vi.stubEnv('SANDCASTLE_AGENT', 'pi');
    vi.stubEnv('SANDCASTLE_PI_MODEL', 'modelo-auditoria');

    const resultado = {
      branch: 'sandcastle-issue-41',
      commits: [{ hash: 'abc123' }],
      logFilePath: '/tmp/sandcastle.log',
    } as RunResult;

    expect(formatarResultadoAgente('issue', 41, resultado)).toBe(
      [
        'issue #41 processado pelo Sandcastle.',
        'Executor: agente=pi modelo=modelo-auditoria',
        'Branch: sandcastle-issue-41',
        'Commits: 1',
        'Log: /tmp/sandcastle.log',
      ].join('\n'),
    );

    vi.unstubAllEnvs();
  });
});
