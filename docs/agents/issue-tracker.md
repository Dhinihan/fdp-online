# Issue tracker: GitHub

Issues e specs deste repo vivem como GitHub Issues. Use a CLI `gh` para todas as operações.

## Repositório

- **Owner/repo**: `Dhinihan/fdp-online`
- Inferir o repositório a partir de `git remote -v` ao executar comandos dentro deste clone.

## Convenções

- **Criar issue**: `gh issue create --title "..." --body "..."`.
- **Ler issue**: `gh issue view <numero> --comments`.
- **Listar issues**: `gh issue list --state open --json number,title,body,labels,comments` com filtros apropriados.
- **Comentar**: `gh issue comment <numero> --body "..."`.
- **Aplicar/remover labels**: `gh issue edit <numero> --add-label "..."` / `--remove-label "..."`.
- **Fechar**: `gh issue close <numero> --comment "..."`.

## Quando uma skill disser "publish to the issue tracker"

Crie uma GitHub issue.

## Quando uma skill disser "fetch the relevant ticket"

Execute `gh issue view <numero> --comments`.

## Operações do Wayfinder

O `wayfinder` representa o mapa e seus tickets como GitHub Issues.

- **Labels**: antes do primeiro mapa, criar os labels ausentes com
  `gh label create <nome> --color 5319E7`. Os nomes são
  `wayfinder:map`, `wayfinder:research`, `wayfinder:prototype`,
  `wayfinder:grilling` e `wayfinder:task`.
- **Mapa**: uma issue com o label `wayfinder:map`.
- **Ticket de decisão**: uma sub-issue do mapa com um dos labels
  `wayfinder:research`, `wayfinder:prototype`, `wayfinder:grilling`
  ou `wayfinder:task`.
- **Fallback para sub-issues**: quando o recurso não estiver
  disponível, adicionar o ticket à task list do mapa e iniciar seu
  corpo com `Part of #<mapa>`.
- **Bloqueio**: usar dependências nativas do GitHub. Criar a relação
  com `gh api --method POST repos/<owner>/<repo>/issues/<ticket>/dependencies/blocked_by`
  e passar `-F issue_id=<database-id-do-bloqueador>`. Obter o
  database id com
  `gh api repos/<owner>/<repo>/issues/<numero> --jq .id`.
- **Fallback para bloqueio**: iniciar o corpo com
  `Blocked by: #<numero>`.
- **Fronteira**: tickets abertos do mapa sem bloqueadores abertos e
  sem responsável.
- **Claim**: executar `gh issue edit <numero> --add-assignee @me`
  antes de trabalhar no ticket.
- **Resolução**: comentar a resposta, fechar o ticket e adicionar ao
  mapa um link com o resumo da decisão.
