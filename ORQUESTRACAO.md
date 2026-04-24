# Orquestração do Pi CLI

> Como o Hermes orquestra o Pi CLI para implementar issues e revisões do FDP.

---

## Visão Geral

| Entidade | Função |
|----------|--------|
| **Vinícius** | Dono do produto. Revisa PRs direto no GitHub. |
| **Hermes** | Orquestrador. Prepara workspace, dispara Pi, monitora progresso, reporta ao Vinícius. |
| **Pi CLI** | Coding agent. Implementa código, abre PRs, aplica revisões. Autônomo. |
| **GitHub** | Repo, issues, PRs, CI. Fonte da verdade. |

---

## Comandos do Pi

O Pi está instalado via nvm e configurado com **kimi2.5**.

### 1. Implementar Issue

**Método preferido (prompt inline):**

```bash
cd <worktree>
export PATH="/home/agente/.nvm/versions/node/v24.15.0/bin:$PATH"
pi --print --no-session "Leia AGENTS.md, ARQUITETURA.md, e execute 'gh issue view <id>'. Depois implemente a issue #<id>. Commit e abra PR."
```

**Método alternativo (skill — use apenas se já testou e funcionou):**

```bash
cd <worktree>
export PATH="/home/agente/.nvm/versions/node/v24.15.0/bin:$PATH"
pi --print --no-session --skill .pi/skills/fdp-issue "/skill:fdp-issue <id>"
```

> **Atenção:** Skills grandes (>3KB, >50 linhas) podem travar silenciosamente. Se travar após 3-5 min com log vazio, use o método de prompt inline.

O Pi:
1. Lê `AGENTS.md` (automático, está no diretório).
2. Busca a issue no GitHub.
3. Implementa seguindo arquitetura e regras.
4. Roda testes.
5. Commita e abre PR via `gh pr create`.

### 2. Revisar PR

```bash
cd <worktree-original-ou-novo>
export PATH="/home/agente/.nvm/versions/node/v24.15.0/bin:$PATH"
pi --print --no-session "Leia os comentários do PR #<pr-id> no GitHub. Aplique as revisões necessárias e push um novo commit no mesmo PR."
```

---

## Gerenciamento de Workspace (Hermes)

```
.pi/
  worktrees/
    issue-5/         ← worktree isolado para issue #5
  logs/
    issue-5.log      ← stdout do Pi
  pids/
    issue-5.pid      ← PID do processo Pi
```

### Script de Orquestração (Hermes)

```bash
# 1. Criar branch e worktree
BRANCH="feat/issue-$ISSUE_ID"
git checkout -b "$BRANCH"
git worktree add .pi/worktrees/issue-$ISSUE_ID "$BRANCH"

# 2. Disparar Pi em background
cd .pi/worktrees/issue-$ISSUE_ID
pi -p --skill .pi/skills/fdp-issue "/skill:fdp-issue $ISSUE_ID" \
   > ../../logs/issue-$ISSUE_ID.log 2>&1 &
echo $! > ../../pids/issue-$ISSUE_ID.pid

# 3. Monitorar
# Hermes verifica periodicamente se o PID ainda existe.
# Quando o processo morre, extrai o resultado do log.
```

---

## Fluxo Completo

```mermaid
sequenceDiagram
    participant V as Vinícius
    participant H as Hermes
    participant Pi as Pi CLI
    participant GH as GitHub

    V->>H: "Vamos implementar issue #5"
    H->>H: Cria worktree + branch
    H->>Pi: pi -p --skill .pi/skills/fdp-issue "/skill:fdp-issue 5"
    Note over Pi: Lê AGENTS.md<br/>Busca issue #5<br/>Implementa<br/>Roda testes<br/>Abre PR
    Pi->>GH: Push + PR criado
    H->>V: "PR #12 aberto para issue #5"
    V->>GH: Revisa e comenta
    V->>H: "Revisão feita no PR #12"
    H->>H: Cria worktree da revisão
    H->>Pi: pi -p --skill .pi/skills/fdp-revisao "/skill:fdp-revisao 12"
    Note over Pi: Lê comentário<br/>Ajusta código<br/>Push novo commit
    Pi->>GH: Novo commit no PR #12
    H->>V: "Ajustes aplicados no PR #12"
```

---

## Skills do Pi

As skills ficam em `.pi/skills/` dentro do repo:

```
.pi/skills/
  fdp-issue/
    SKILL.md        ← Instruções para implementar issues
  fdp-revisao/
    SKILL.md        ← Instruções para aplicar revisões
```

---

## Aprendizados Práticos (atualizado em 2026-04-24)

### 1. Skills grandes travam silenciosamente

**Descoberto na issue #2:** A skill `fdp-issue` (5.189 bytes / 106 linhas) travou o Pi em todas as tentativas com `--skill` + `/skill:`, mesmo usando corretamente ambos. O processo existia mas nunca produzia output (log em 0 bytes).

**Solução:** Prompt inline com instruções completas no lugar de carregar a skill.

**Regra:**
- Skills pequenas (< 3KB): pode usar `--skill` + `/skill:`
- Skills grandes (> 3KB): use prompt inline direto

### 2. Foreground é mais confiável que background neste ambiente

Execuções em background (`&`, `nohup`, `terminal(background=true)`) frequentemente perdem o PATH do nvm ou falham no redirecionamento de logs. O modo foreground com `timeout=300` ou `timeout=600` é o mais confiável.

**Sempre use:**
```bash
export PATH="/home/agente/.nvm/versions/node/v24.15.0/bin:$PATH"
cd .pi/worktrees/issue-N
pi --print --no-session "prompt completo aqui"
```

### 3. Sempre verifique se o worktree tem os arquivos

Depois de `git worktree add`, confirme que `src/`, `tests/`, `package.json` existem no filesystem. O `git ls-tree` pode mostrar arquivos que o worktree não tem se houve erro na criação.

---

## Notas

- O Pi **não sabe que o Hermes existe**. Ele recebe um prompt e executa.
- O Hermes **não acompanha em tempo real**. Só verifica logs/PIDs quando perguntado.
- Vinícius **revisa PRs direto no GitHub**, sem intermediário.
- Se o Pi travar ou der erro, o log em `.pi/logs/` é a fonte de debug.
- **Skills grandes (>3KB) devem ser usadas como prompt inline**, não via `--skill`.

---

## Próximos Passos

1. ~~Criar `AGENTS.md` na raiz do projeto.~~ ✅ Feito.
2. ~~Criar skills `fdp-issue` e `fdp-revisao`.~~ ✅ Feitas.
3. ~~Testar fluxo end-to-end com uma issue simples.~~ ✅ Issue #1 (Fase 0) implementada e revisada.
4. Evoluir o `ORQUESTRACAO.md` conforme novos aprendizados (ex: redirecionamento de logs, worktree cleanup, timeouts).
