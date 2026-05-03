# AGENTS.md — FDP (Faz De Propósito)

> Regras de desenvolvimento para agentes de código no projeto FDP.
> Este arquivo descreve convenções, restrições e referências úteis para atuar no projeto.

---

## 0. Referências do Projeto

Use estes arquivos quando fizer sentido para a tarefa:

1. **`AGENTS.md`** ← convenções de código, testes, qualidade e fluxo de trabalho.
2. **Issue do GitHub** ← contexto da tarefa específica, quando existir.
3. **`ARQUITETURA.md`** ← decisões arquiteturais do projeto (stack, camadas, fluxo de dados, estrutura de pastas).
4. **`REGRAS.md`** ← versão enxuta e canônica das regras do jogo.
5. **`CONTEXT.md`** e **`docs/adr/`** ← vocabulário de domínio e decisões registradas, quando existirem.

---

## 1. Arquitetura

- **Clean Architecture / Ports & Adapters**. O core do jogo é TypeScript puro. Não importa Phaser no `src/core/`.
- O core emite **eventos imutáveis**. O adapter (Phaser) consome e renderiza.
- Se precisar trocar a engine no futuro, só o adapter muda.

```
src/
  core/       ← Regras puras. Phaser não entra aqui.
  adapters/   ← Phaser, bots, input, render.
  store/      ← Event emitter + estado reativo.
```

---

## 2. Código

- **Idioma do código**: Português brasileiro. Nomes de variáveis, funções, classes em PT-BR.
- **Idioma da interface**: PT-BR, EN, ES (i18n).
- **Complexidade máxima**: 10 (cyclomatic).
- **Tamanho máximo**: 200 linhas/arquivo, 30 linhas/função, 3 parâmetros/função.
- **Sem any implícito**. TypeScript estrito.

---

## 3. Testes

### Core (`src/core/`, `src/store/`)

- **TDD obrigatório.** 1 teste → 1 implementação → repete.
- Test runner: **Vitest**.
- Todo código do core precisa de teste antes do PR.
- Nomes de teste em português descritivos (ex: `deve retornar true quando 3 compara com 2`).

### Adapter (`src/adapters/`)

⚠️ **NUNCA escreva testes unitários (Vitest) para código em `src/adapters/`.**

- O Phaser depende de WebGL/Canvas e **não inicializa em Node**. Testes em Vitest quebram ou falseiam resultado.
- A validação é **visual**: o Vercel gera deploy preview automaticamente. O revisor humano verifica no browser.
- **Exceção:** `BotDeterministico.ts` e outros adapters **sem dependência do Phaser** podem ter teste unitário normalmente.
- E2E com Playwright (`VITE_TEST_SEED=1337`) entra na Fase 5, para fluxos jogáveis completos e regressão visual com valor real. Não use antes disso.

---

## 4. Commits e Qualidade

- **Conventional Commits**: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`.
- **Pre-commit hooks**: Prettier + ESLint + typecheck + testes rodam automaticamente.
- **Knip**: detecta dependências e código morto.

---

## 5. Ferramentas

| Tarefa                      | Comando          |
| --------------------------- | ---------------- |
| Instalar deps               | `pnpm install`   |
| Servidor de desenvolvimento | `pnpm dev`       |
| Testes                      | `pnpm test`      |
| Typecheck                   | `pnpm typecheck` |
| Lint                        | `pnpm lint`      |
| Build                       | `pnpm build`     |

---

## 6. Regras do Jogo (resumo)

- Baralho padrão de 52 cartas.
- 5 pontos iniciais, só diminuem, negativos permitidos.
- Anti-horário. Último jogador embaralha.
- Rodada N → N cartas cada (máx 13).
- Manilha: próximo valor na hierarquia (3>2>A>K>Q>J>10>9>8>7>6>5>4).
- Penalidade: |declarado - feito| subtraído dos pontos.
- 1ª rodada especial: não vê própria carta, mas vê as dos outros.

Para regras completas, leia `REGRAS.md`.

## Agent skills

### Hermes (planejamento)

Hermes auxilia Vinícius no planejamento e refinamento de
issues. Consulte `docs/agents/hermes.md` para o workflow
completo.

### Issue tracker

Issues são gerenciadas no GitHub do repositório (`Dhinihan/fdp-online`). See `docs/agents/issue-tracker.md`.

### Triage labels

Usa os labels canônicos, com `ready-for-agent` mapeado para `sandcastle:run`. See `docs/agents/triage-labels.md`.

### Domain docs

Layout `single-context`: um contexto global no root quando existir. See `docs/agents/domain.md`.
