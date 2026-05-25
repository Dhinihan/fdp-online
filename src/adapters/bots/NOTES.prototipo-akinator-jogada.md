# PROTOTIPO DESCARTAVEL - Akinator de Jogada dos Bots

Pergunta validada: a arvore de `docs/arvores-de-decisao-dos-bots.md`
fica compreensivel quando percorrida como entrevista binaria sobre mao,
mesa, necessidade, limites de classificacao e temperatura?

Comando:

```bash
pnpm prototipo:bots
```

O prototipo aceita apenas respostas `sim`/`nao`, retorna jogadas
relativas, como `Escolha de vencedora por necessidade`, em vez de uma
carta concreta, e mostra separadamente o resultado da linha fria e da
linha quente. Quando elas divergem, ele apenas informa que a temperatura
decidiria no jogo real.

Veredito a preencher depois da validacao manual:

- Ramos confusos:
- Perguntas faltantes:
- Ajustes desejados na arvore canonica:
- Decisao: deletar prototipo ou absorver aprendizado no decisor real.
