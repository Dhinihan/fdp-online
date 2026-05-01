# AGENTS.md — FDP (Faz De Propósito)

> Regras de desenvolvimento para agentes de código no projeto FDP.
> Leia este arquivo antes de qualquer implementação.

---

## 0. Leitura Obrigatória

Antes de qualquer implementação, leia na seguinte ordem:

1. **Este arquivo (`AGENTS.md`)** ← regras de código, testes, qualidade.
2. **`ARQUITETURA.md`** ← decisões arquiteturais do projeto (stack, camadas, fluxo de dados, estrutura de pastas).
3. A **issue do GitHub** que você vai implementar.

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

- **Core**: TDD obrigatório. 1 teste → 1 implementação → repete.
- **Test runner**: Vitest.
- **E2E**: Playwright com seed fixa (`VITE_TEST_SEED=1337`) para fluxos jogáveis e regressões visuais com valor real.
- **Adapter (Phaser)**: não faz TDD. E2E/screenshot entram quando houver fluxo de jogo ou risco concreto de regressão visual; placeholder isolado e protótipo simples não exigem E2E por padrão.
- Todo código do core precisa de teste antes do PR.

---

## 4. Commits e Qualidade

- **Conventional Commits**: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`.
- **Pre-commit hooks**: Prettier + ESLint + typecheck + testes rodam automaticamente.
- **Knip**: detecta dependências e código morto.

---

## 5. Ferramentas

| Tarefa        | Comando          |
| ------------- | ---------------- |
| Instalar deps | `pnpm install`   |
| Dev server    | `pnpm dev`       |
| Testes        | `pnpm test`      |
| Typecheck     | `pnpm typecheck` |
| Lint          | `pnpm lint`      |
| Build         | `pnpm build`     |

---

## 6. Regras do Jogo (resumo)

- Baralho padrão de 52 cartas.
- 5 pontos iniciais, só diminuem, negativos permitidos.
- Anti-horário. Último jogador embaralha.
- Rodada N → N cartas cada (máx 13).
- Manilha: próximo valor na hierarquia (3>2>A>K>Q>J>7>6>5>4).
- Penalidade: |declarado - ganho| subtraído dos pontos.
- 1ª rodada especial: não vê própria carta, mas vê as dos outros.

Para regras completas, abra `index.html` no navegador.
