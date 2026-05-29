# Arvores de Decisao dos Bots

> Documento canonico da estrategia explicavel de jogada dos bots.
> Este documento descreve a arvore pretendida para **Jogada**. Declaracao aparece apenas como contrato auxiliar de debug.

## Objetivo

Definir uma arvore de decisao legivel para os bots do FDP, de modo que cada jogada possa ser explicada por um caminho claro no debug.

A estrategia de Jogada tem duas linhas:

- **Linha fria:** estrategia conservadora e deterministica.
- **Linha quente:** estrategia mais agressiva, que pode preservar carta garantida_agora, atravessar adversarios ou pressionar a mesa.

Quando as linhas escolhem cartas diferentes, a **temperatura** decide apenas a chance de usar a Linha quente. A temperatura nao muda a arvore base.

## Conceitos

- **Necessidade:** `declarado - feito`. Se for `<= 0`, o bot ja cumpriu a declaracao e nao quer fazer a vaza.
- **Urgencia:** `necessidade / cartasNaMao`.
- **Urgencia alta:** `urgencia >= 0.66`.
- **Lider:** jogador que esta vencendo a mesa no momento.
- **Jogadores por agir:** jogadores que ainda jogarao carta depois do bot no turno atual.
- **Jogador interessado:** lider atual ainda precisa fazer vaza ou algum jogador por agir ainda precisa fazer vaza (`necessidade > 0`).
- **Vencedoras:** cartas da mao que vencem a carta lider atual.
- **Perdedoras:** cartas da mao que perdem para a carta lider atual.
- **Empates:** cartas da mao que empatam com a carta lider atual. Empate nao conta como fazer a vaza.
- **Carta que nao faz a vaza:** perdedora ou empate.
- **Baixa, media, alta, segura e garantida_agora:** categorias calculadas pelo avaliador de cartas do algoritmo real, considerando forca relativa, manilha, cartas vivas e contexto da vaza. Os exemplos do prototipo servem apenas como atalho de entrevista, nao como contrato de classificacao.
- **Escolha de vencedora por necessidade:** entre as vencedoras, ordenadas da mais fraca para a mais forte, escolher a carta que preserva forca proporcionalmente ao quanto ainda falta fazer.
- **Descarte por necessidade:** entre as cartas que nao fazem a vaza, ordenadas da mais fraca para a mais forte, descartar preservando forca proporcionalmente ao quanto ainda falta fazer.

## Regras Globais de Jogada

A primeira bifurcacao da Jogada e sempre a posicao na mesa:

```text
se mesa esta vazia:
  seguir arvore "abre a mesa"
senao se jogadoresPorAgir == 0:
  seguir arvore "fecha a mesa"
senao:
  seguir arvore "joga no meio"
```

A resolucao final entre Linha fria e Linha quente e:

```text
fria = decidirLinhaFria(...)
quente = decidirLinhaQuente(...)

se fria.carta == quente.carta:
  jogar fria.carta
  registrar que nao houve sorteio por temperatura
senao:
  sorteio = rng.random()
  se sorteio < temperatura:
    jogar quente.carta
  senao:
    jogar fria.carta
```

As funcoes de escolha por necessidade usam a ordenacao real da carta, considerando manilha e desempate por naipe.

```text
escolherVencedoraPorNecessidade(vencedoras, necessidade):
  ordenadas = vencedoras da mais fraca para a mais forte
  indice = se ordenadas.length >= necessidade:
    ordenadas.length - necessidade
  senao:
    0
  retornar ordenadas[indice]

descartePorNecessidade(candidatas, necessidade):
  ordenadas = candidatas da mais fraca para a mais forte
  indice = se ordenadas.length > necessidade:
    ordenadas.length - necessidade
  senao:
    0
  retornar ordenadas[indice]
```

## Arvore: Abre a Mesa

Ao abrir a mesa nao existe carta lider. A decisao e feita pela classificacao da mao.

A arvore depende apenas da ordem de preferencia entre categorias. A forma exata de classificar cada carta pertence ao avaliador de cartas, nao a esta arvore.

```text
se necessidade <= 0:
  escolher a carta mais barata na primeira categoria disponivel:
    baixa, media, alta, segura, garantida_agora

senao se urgencia alta:
  escolher a carta mais barata na primeira categoria disponivel:
    alta, media, segura, baixa, garantida_agora

senao:
  escolher a carta mais barata na primeira categoria disponivel:
    baixa, media, alta, segura, garantida_agora
```

Linha quente, na abertura, nao cria um ramo diferente por si so. Se uma futura regra de abertura quente existir, ela ainda deve passar pela resolucao por temperatura quando divergir da Linha fria.

## Arvore: Joga no Meio

Esta arvore vale quando ja existe carta na mesa e ainda ha pelo menos um jogador por agir depois do bot.

### Guarda de Posicao

Antes de tentar fazer a vaza, a estrategia avalia o risco posicional.

```text
se jogadoresPorAgir == 1:
  se o jogador por agir ainda precisa fazer:
    Linha fria so pode tentar fazer se:
      existe vencedora garantida_agora
      ou urgencia alta
  senao:
    pode tentar fazer normalmente

se jogadoresPorAgir >= 2:
  se todos os jogadores por agir ja cumpriram:
    pode tentar fazer normalmente
  senao:
    so pode tentar fazer se urgencia alta
```

### Linha Fria no Meio

```text
se necessidade <= 0:
  candidatas = cartas que nao fazem a vaza
  se candidatas nao esta vazio:
    jogar a carta mais alta entre candidatas
  senao:
    jogar a carta mais barata da mao

senao:
  se guarda de posicao nao permite tentar fazer:
    candidatas = cartas que nao fazem a vaza
    se candidatas nao esta vazio:
      jogar descartePorNecessidade(candidatas, necessidade)
    senao:
      jogar a carta mais barata da mao

  senao se vencedoras nao esta vazio:
    jogar escolherVencedoraPorNecessidade(vencedoras, necessidade)

  senao:
    candidatas = cartas que nao fazem a vaza
    se candidatas nao esta vazio:
      jogar descartePorNecessidade(candidatas, necessidade)
    senao:
      jogar a carta mais barata da mao
```

### Linha Quente no Meio

A Linha quente parte da mesma leitura de necessidade e posicao, mas pode recomendar uma carta diferente quando existe valor estrategico em pressionar, atravessar ou preservar uma garantida_agora.

```text
se necessidade <= 0:
  se lider interessado e lider e alta+ e existe empate:
    recomendar o empate mais forte
  senao se existe perdedora:
    recomendar a perdedora mais forte
  senao se existe empate:
    recomendar o empate mais forte
  senao:
    seguir Linha fria

senao se pode atravessar:
  recomendar a vencedora mais barata que nao seja garantida_agora

senao se pode pressionar e esperar:
  se existe carta de fuga que nao e segura nem garantida_agora:
    recomendar a fuga mais cara
  senao:
    recomendar a vencedora mais barata que nao seja garantida_agora,
    preservando uma garantida_agora para depois

senao se pode tentar com vencedora segura:
  recomendar a vencedora segura mais barata

senao se pode esperar oportunidade:
  recomendar descartePorNecessidade(cartas que nao fazem a vaza, necessidade)

senao:
  seguir Linha fria
```

Quando `necessidade <= 0`, a Linha quente no meio espelha a prioridade da Linha quente fechando.
Empate agressivo contra lider interessado so vale com carta lider `alta+`, porque empate nao toma a vaza mas impede o lider de cumprir.
Com lider `media` ou `baixa`, a Linha quente **nao** empata para punir: prefere perdedora mais forte e deixa o lider seguir na vaza.
A Linha fria, no mesmo caso, joga a carta mais alta entre perdedoras e empates; quando ha empate na mao, fria e quente costumam divergir aqui.
`seguir Linha fria` no fim do ramo so ocorre quando nao ha perdedora nem empate (fuga impossivel sem vencer).

`pode atravessar` significa:

```text
necessidade > 0
e urgencia alta
e lider ainda precisa fazer
e lider jogou carta alta+
e existe vencedora que nao seja garantida_agora
```

`necessidade > 0` aqui nao define o atravessar; so separa este bloco do ramo `necessidade <= 0`, em que a Linha quente tenta **nao** fazer a vaza. Quando `pode atravessar` e verdadeiro, fria e quente **ambas** querem vencer; a divergencia esta na **carta**:

- **Linha fria:** `escolherVencedoraPorNecessidade(vencedoras, necessidade)` — pode gastar `garantida_agora` e escolhe forca proporcional ao quanto ainda falta.
- **Linha quente:** vencedora mais barata que nao seja `garantida_agora`.

Com urgencia alta, a Guarda de Posicao da Linha fria **ja permite** tentar vencer. O atravessar nao ignora a guarda; escolhe uma carta diferente da fria.

Exemplo: faltam 2 vazas, ha 3 cartas na mao, lider com 2 ainda precisa fazer, mao com `3` (`garantida_agora`) e duas manilhas `4`, todas vencem o lider.

- Linha fria: `G[2-2]` → `3`
- Linha quente: manilha `4` mais barata (nao e `garantida_agora`)

`pode pressionar e esperar` significa:

```text
necessidade > 0
e existe vencedora
e urgencia < 0.66
e existe jogador interessado
e existe garantida_agora para depois
e (
    existe carta de fuga util agora
    ou existe vencedora barata que preserva garantida_agora para depois
  )
```

O ultimo `e (... ou ...)` e avaliado como um bloco unico: as quatro primeiras condicoes precisam ser verdadeiras **e** pelo menos uma das duas alternativas finais tambem. Se as quatro primeiras forem verdadeiras mas **nenhuma** das duas alternativas existir, `pode pressionar e esperar` e **falso** e a Linha quente desce para o proximo ramo (`pode tentar com vencedora segura`). Em particular, ter `garantida_agora para depois` nao basta sozinho para entrar neste ramo.

`existe carta de fuga util agora` significa que ha perdedora ou empate que nao seja segura nem garantida_agora.

`existe vencedora barata que preserva garantida_agora para depois` significa que ha vencedora nao garantida_agora e ainda sobra carta garantida_agora para sustentar os turnos seguintes.

A escolha da carta dentro do ramo segue a ordem do pseudocodigo: se `existe carta de fuga util agora`, joga a fuga mais cara; senao, joga a vencedora barata preservando a garantida_agora.

`pode tentar com vencedora segura` significa:

```text
necessidade > 0
e existe vencedora
e urgencia < 0.66
e existe jogador interessado
e nao existe garantida_agora para depois
e lider atual ainda precisa fazer
e lider jogou carta alta+
e existe vencedora segura
```

`existe vencedora segura` significa que ha carta segura que vence a carta lider atual. Referencias praticas: 2, 3 ou manilha.

A condicao `nao existe garantida_agora para depois` e o **eixo unico** que separa este ramo de `pode pressionar e esperar`: as duas leem o mesmo fato (`existe garantida_agora para depois`) com sinal oposto. Como `pode pressionar e esperar` e avaliado primeiro:

- Se **ha** garantida_agora para depois e existe fuga util ou vencedora barata, a Linha quente ja parou em `pode pressionar e esperar`; este ramo nem e alcancado.
- Se **ha** garantida_agora para depois mas nao ha fuga util nem vencedora barata, `pode pressionar e esperar` falhou no fim; este ramo tambem falha aqui (em `nao existe garantida_agora para depois`) e a decisao desce para `pode esperar oportunidade`.
- Se **nao ha** garantida_agora para depois, `pode pressionar e esperar` ja havia falhado nessa condicao; este ramo segue avaliando lider e vencedora segura.

A ordem de avaliacao tambem importa: confirma-se primeiro `existe jogador interessado` (interesse generico) e so depois se especializa para o lider (`lider atual ainda precisa fazer` e `lider jogou carta alta+`).

`pode esperar oportunidade` significa:

```text
necessidade > 0
e urgencia < 0.66
e existe carta que nao faz a vaza
```

Esse ramo existe para a Linha quente tambem poder escolher espera ativa quando nao ha motivo suficiente para atravessar, pressionar ou gastar vencedora segura. A decisao relativa e `descartePorNecessidade(perdedoras + empates, necessidade)`.

E o **coletor** dos ramos de `necessidade > 0`: tem as condicoes menos exigentes (so urgencia baixa e ao menos uma carta que nao faz a vaza). Recebe os casos em que atravessar, pressionar e vencedora segura ja falharam mas ainda sobra carta de fuga para descartar.

Por consequencia, o `seguir Linha fria` final (fallback) so e alcancado quando **nao existe carta que nao faz a vaza** — ou seja, toda carta da mao vence o lider e nao ha como esperar sem fazer a vaza.

## Arvore: Fecha a Mesa

Esta arvore vale quando `jogadoresPorAgir == 0`. Como ninguem joga depois do bot, a decisao e mais deterministica.

### Linha Fria Fechando

```text
se necessidade > 0:
  se vencedoras nao esta vazio:
    jogar escolherVencedoraPorNecessidade(vencedoras, necessidade)
  senao:
    jogar descartePorNecessidade(perdedoras + empates, necessidade)

senao:
  candidatas = perdedoras + empates
  se candidatas nao esta vazio:
    jogar a carta mais forte entre candidatas
  senao:
    jogar a carta mais forte da mao
```

### Linha Quente Fechando

```text
se necessidade > 0:
  se vencedoras esta vazio:
    jogar descartePorNecessidade(perdedoras + empates, necessidade)

  senao se deve fazer agora:
    jogar escolherVencedoraPorNecessidade(vencedoras, necessidade)

  senao se perdedoras nao esta vazio:
    jogar descartePorNecessidade(perdedoras, necessidade)

  senao:
    jogar escolherVencedoraPorNecessidade(vencedoras, necessidade)

senao:
  se lider ainda precisa fazer e lider e alta+ e empates nao esta vazio:
    jogar o empate mais forte
  senao se perdedoras nao esta vazio:
    jogar a perdedora mais forte
  senao se empates nao esta vazio:
    jogar o empate mais forte
  senao:
    jogar a carta mais forte da mao
```

`deve fazer agora` significa:

```text
nao existe lider
ou lider ainda precisa fazer e lider e alta+
ou urgencia alta
```

Quando `necessidade > 0`, a Linha quente fechando pode adiar a tentativa se existe vencedora, mas `deve fazer agora` e falso. Nesse caso, se houver perdedora, descarta por necessidade apenas entre perdedoras. Se nao houver descarte seguro, volta a fazer com vencedora por necessidade.

Quando `necessidade <= 0`, a Linha quente fechando prioriza nao fazer a vaza. A unica divergencia agressiva antes disso e empatar uma carta alta+ de um lider interessado, porque empate nao toma a vaza mas pressiona o lider. Se nao houver esse empate, ela prefere perdedora mais forte, depois empate mais forte, e so segue a Linha fria quando nao ha carta que nao faz.

## Contrato de Debug

O debug de Jogada deve permitir reconstruir o caminho percorrido olhando apenas o log.

Campos minimos:

- Posicao na mesa: abre, meio ou fecha.
- Necessidade: quanto ainda precisa fazer.
- Urgencia: valor calculado e se e alta (`>= 0.66`).
- Jogadores por agir: quantidade e status resumido.
- Linha fria: caminho percorrido, motivo estrategico e carta escolhida.
- Linha quente: caminho percorrido, motivo estrategico e carta escolhida.
- Sorteio por temperatura: valor e comparacao quando ocorreu, ou "nao ocorreu".

Nao e obrigatorio registrar todas as perguntas possiveis da arvore. O log deve mostrar o caminho percorrido.

Para Declaracao, o debug deve mostrar:

- base deterministica;
- sorteios aplicaveis;
- sorteios nao aplicaveis;
- defensivo;
- resultado final.

## Fora de Escopo

- Transformar este documento em PRD.
- Criar issues no GitHub.
- Redesenhar a estrutura da Declaracao.
- Alterar o papel da temperatura na Declaracao.
- Reescrever o algoritmo de avaliacao de cartas.
- Definir testes de implementacao para cada ramo.
