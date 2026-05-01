# Issue tracker: GitHub

Issues e PRDs deste repo vivem como GitHub Issues. Use a CLI `gh` para todas as operações.

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
