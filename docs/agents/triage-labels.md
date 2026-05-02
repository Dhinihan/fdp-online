# Triage Labels

As skills usam cinco papéis canônicos de triagem. Este arquivo mapeia esses papéis para os labels reais usados neste repo.

| Label canônico    | Label neste tracker | Significado                                        |
| ----------------- | ------------------- | -------------------------------------------------- |
| `needs-triage`    | `needs-triage`      | Maintainer precisa avaliar a issue                 |
| `needs-info`      | `needs-info`        | Aguardando mais informações do autor               |
| `ready-for-agent` | `sandcastle:run`    | Totalmente especificada, pronta para um agente AFK |
| `ready-for-human` | `ready-for-human`   | Requer implementação humana                        |
| `wontfix`         | `wontfix`           | Não será executada                                 |

Quando uma skill mencionar um papel de triagem, use o label correspondente desta tabela.

Estados operacionais do Sandcastle fora da triagem canônica:

- `sandcastle:running`: item atualmente em execução.
- `sandcastle:waiting`: item aguardando dependência de outra issue aberta; deve sair da fila do agente sem virar bloqueio manual.
- `sandcastle:blocked`: item bloqueado por ambiente ou por bloqueio manual de escopo.
