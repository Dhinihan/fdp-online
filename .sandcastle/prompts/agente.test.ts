import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const CAMINHO_PROMPT = new URL('./agente.md', import.meta.url);

describe('prompt do agente de issue', () => {
  it('instrui usar waiting para dependencia de outra issue aberta', () => {
    const prompt = readFileSync(CAMINHO_PROMPT, 'utf8');

    expect(prompt).toContain('Adicione a label `sandcastle:waiting`.');
    expect(prompt).toContain('Garanta que a label `{{label_execucao}}` não esteja mais presente.');
    expect(prompt).toContain('Registre as dependências descobertas no campo canônico `## Blocked by`');
    expect(prompt).toContain('Não adicione `sandcastle:blocked` apenas por estar aguardando outra issue.');
    expect(prompt).not.toContain('Não implemente workaround paralelo nem altere o corpo da issue');
  });
});
