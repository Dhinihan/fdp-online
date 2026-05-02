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
    expect(prompt).toContain('Se a seção já existir, atualize sem duplicá-la');
    expect(prompt).toContain('Pare. Não implemente workaround paralelo.');
  });

  it('instrui sincronizar com origin/main antes do push final', () => {
    const prompt = readFileSync(CAMINHO_PROMPT, 'utf8');

    expect(prompt).toContain(
      'Antes do push final, sincronize a branch atual com `origin/main` executando nesta ordem:',
    );
    expect(prompt).toContain('`git fetch origin`');
    expect(prompt).toContain('`git merge origin/main`');
    expect(prompt).toContain(
      'Se o merge for limpo (fast-forward ou merge automático sem conflito), prossiga com o push normalmente.',
    );
    expect(prompt).toContain(
      'Se houver conflito resolvível, resolva o conflito, faça commit da resolução e prossiga com o push.',
    );
    expect(prompt).toContain('Se houver conflito irrecuperável, execute `git merge --abort`');
    expect(prompt).toContain('adicione a label `sandcastle:blocked`');
  });
});
