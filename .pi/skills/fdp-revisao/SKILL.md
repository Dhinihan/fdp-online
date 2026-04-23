---
name: fdp-revisao
description: Aplica revisão de PR no projeto FDP. Leia o comentário de revisão, ajuste o código, push no mesmo PR.
---

## Instruções

Você vai aplicar uma revisão de PR no projeto FDP. Siga rigorosamente este fluxo.

### 1. Leitura Obrigatória

Antes de qualquer mudança, leia nesta ordem:
1. `AGENTS.md` na raiz ← regras do projeto.
2. `ARQUITETURA.md` na raiz ← decisões arquiteturais (stack, camadas, fluxo de dados).
3. O PR e seus comentários: `gh pr view <pr-id> --json title,body,comments`

### 2. Análise

- Entenda o que o revisor pediu.
- Identifique quais arquivos precisam mudar.
- Se algo não estiver claro, faça o ajuste mais razoável e documente no commit.

### 3. Ajuste (TDD no core)

- Mantenha o mesmo padrão de código (PT-BR, funções pequenas).
- **Se o revisor apontou bug no `src/core/`:**
  1. Escreva um teste que reproduza o bug (RED).
  2. Corrija o bug com o mínimo de código (GREEN).
  3. Refatore se necessário.
  4. Siga a filosofia TDD: teste comportamento via interface pública, não detalhe de implementação. Use fatias verticais (tracer bullets), nunca fatias horizontais.
- **Se é no adapter:** ajuste diretamente.

### 4. Validação

```bash
pnpm typecheck
pnpm lint
pnpm test
```

Todos devem passar.

### 5. Push

```bash
git add .
git commit -m "fix: ajustes da revisão no PR #<pr-id>"
git push origin <branch-do-pr>
```

Não precisa criar novo PR. O commit vai para o PR existente.
