---
name: fdp-issue
description: Implementa uma issue do GitHub no projeto FDP. Leia AGENTS.md e a issue antes de codar. Rode testes. Abra PR.
---

## Instruções

Você vai implementar uma issue do projeto FDP (Faz De Propósito). Siga rigorosamente este fluxo.

### 1. Leitura Obrigatória

Antes de escrever qualquer código, leia nesta ordem:
1. `AGENTS.md` na raiz do projeto → regras de código, testes, qualidade.
2. `ARQUITETURA.md` na raiz → decisões arquiteturais (stack, camadas, fluxo de dados).
3. A issue no GitHub: `gh issue view <id> --json title,body,labels`

### 2. Entenda a Arquitetura

- `src/core/` ← **TypeScript puro**. Sem Phaser. Testável. TDD aqui.
- `src/adapters/phaser/` ← Render, input, scenes. Não faz TDD.
- `src/adapters/bots/` ← IA dos bots.
- `src/store/` ← Event emitter + estado.

### 3. Implementação

- **Core**: comece pelo teste (TDD). 1 teste → 1 implementação → repete.
- **Adapter**: implemente o que o core precisa. Não precisa de teste unitário.
- Use nomes em **Português brasileiro**.
- Mantenha funções pequenas (máx 30 linhas, 3 parâmetros).
- Complexidade máxima: 10.

### 4. Validação

```bash
pnpm typecheck
pnpm lint
pnpm test
```

Todos devem passar antes do commit.

### 5. Commit e PR

```bash
git add .
git commit -m "feat|fix|test|refactor: <descrição em português>"
git push origin <branch>
gh pr create --title "..." --body "Closes #<issue-id>"
```

Abra o PR e me informe o número.
