# Jogo FDP

Contexto do jogo de cartas FDP e da linguagem de domínio usada para descrever suas regras, participantes e fluxo de jogo.

## Language

**Partida**:
Sessão completa do jogo, que começa com todos os jogadores ativos e termina quando apenas um jogador tem pontos positivos.
_Avoid_: Jogo, sessão

**Rodada**:
Ciclo da partida em que cada jogador recebe N cartas, declara quantos turnos pretende fazer e depois joga seus turnos.
_Avoid_: Mão

**Turno**:
Etapa numerada dentro de uma rodada, incluindo o Turno 0 de declaração e os Turnos 1..N de jogada.
_Avoid_: Rodada

**Fazer um turno**:
Vencer um turno de jogada ao jogar a carta vencedora daquela disputa.
_Avoid_: Jogar um turno, completar um turno

**Vaza**:
Conjunto de cartas jogadas em um turno que são recolhidas pelo vencedor daquele turno. Cada vaza conquistada incrementa o **Feito** do jogador ao final da rodada.
_Avoid_: Trick, baza, monte

**Declarado**:
Quantidade de turnos que um jogador afirma que fará em uma rodada.
_Avoid_: Aposta, lance

**Feito**:
Quantidade de turnos que um jogador efetivamente venceu em uma rodada.
_Avoid_: Resultado, ganho

**Manilha**:
Valor de carta mais forte da rodada, definido a partir da carta virada ou assumido como 3 quando não há carta para virar.
_Avoid_: Trunfo

**Jogador eliminado**:
Jogador que deixa de participar das rodadas seguintes após encerrar uma rodada com pontuação menor ou igual a zero.
_Avoid_: Fora, morto

**Pontos**:
Recurso de sobrevivência da partida que começa em 5 para cada jogador e só diminui ao fim das rodadas.
_Avoid_: Vida, score

**Resumo da Rodada**:
Painel mostrado ao fim de cada rodada que apresenta, por jogador, os **Pontos** resultantes e a **Penalidade** sofrida naquela rodada. Aguarda confirmação do jogador antes de seguir para a próxima rodada.
_Avoid_: Placar, relatório, tela de pontuação

**Penalidade**:
Quantidade subtraída dos **Pontos** de um jogador ao fim de uma rodada, igual ao módulo da diferença entre **Declarado** e **Feito**.
_Avoid_: Multa, desconto

**Estratégia de Bot Explicável**:
Comportamento de bot cuja declaração e jogada são coerentes com o estado da rodada e acompanhadas de justificativa auditável no debug.
_Avoid_: IA, inteligência, estratégia

**Árvore de Decisão do Bot**:
Sequência ordenada de perguntas estratégicas que leva o bot a um **Declarado** ou a uma carta jogada.
_Avoid_: Heurística solta, regra isolada

**Linha fria**:
Árvore de decisão conservadora do bot, que prioriza cumprir o próprio **Declarado** com o menor risco.
_Avoid_: Bot frio, modo fácil

**Linha quente**:
Árvore de decisão ousada do bot, que aceita mais risco para preservar cartas fortes, atravessar oponentes ou pressionar a mesa.
_Avoid_: Bot quente, modo difícil

**Decisão de Declaração do Bot**:
Aplicação da **Árvore de Decisão do Bot** no **Turno 0** para escolher o **Declarado**.
_Avoid_: Palpite do bot, aposta do bot

**Decisão de Jogada do Bot**:
Aplicação da **Árvore de Decisão do Bot** nos **Turnos 1..N** para escolher qual carta jogar.
_Avoid_: Movimento do bot, ação do bot

**Escolha de vencedora por necessidade**:
Regra de **Decisão de Jogada do Bot** que escolhe, entre as cartas que vencem a mesa, uma vencedora proporcional ao **Feito** ainda necessário.
_Avoid_: G[N-X]

**Descarte por necessidade**:
Regra de **Decisão de Jogada do Bot** usada quando o bot não consegue vencer a mesa, descartando uma carta que preserve força proporcional ao **Feito** ainda necessário.
_Avoid_: P[N-X]

**Posição na Mesa**:
Lugar estratégico do jogador dentro do turno atual: abrindo a mesa, jogando no meio ou fechando a mesa.
_Avoid_: Ordem, vez

**Jogador por agir**:
Jogador que ainda não jogou carta no turno atual.
_Avoid_: Próximo jogador, jogador restante

**Leitura da Mesa**:
Snapshot dos fatos derivados que uma **Decisão de Jogada do Bot** precisa para escolher a carta: **Feito** ainda necessário, urgência, cartas avaliadas, vencedoras/perdedoras/empates em relação à carta líder, a própria carta líder, **Jogadores por agir** e interessados, e se há alvo na mesa. Calculada uma vez por decisão e consumida igual pela **Linha fria** e pela **Linha quente**.
_Avoid_: Contexto, estado do bot, ContextoJogadaQuente

**Carta alta+**:
Carta cuja categoria estratégica é **alta**, **segura** ou **garantida_agora**.
_Avoid_: Limiar numérico de força, valor alto

**Vencedora segura**:
Carta da categoria estratégica **segura** que vence a carta líder atual.
_Avoid_: Lista manual de valores, carta forte absoluta

## Relationships

- Uma **Partida** contém uma ou mais **Rodadas**.
- Uma **Rodada** contém um **Turno 0** de declaração e **N Turnos** de jogada.
- O vencedor de um **Turno** recolhe as cartas jogadas como uma **Vaza**.
- Cada jogador registra um **Declarado** e um **Feito** em cada **Rodada**.
- Cada **Rodada** define uma **Manilha**.
- A diferença absoluta entre **Declarado** e **Feito** reduz os **Pontos** do jogador ao final da **Rodada**.
- Um jogador com **Pontos** menores ou iguais a zero ao final da **Rodada** se torna um **Jogador eliminado**.
- Uma **Estratégia de Bot Explicável** produz um **Declarado** no **Turno 0** e escolhe cartas nos **Turnos 1..N**.
- Uma **Árvore de Decisão do Bot** descreve como uma **Estratégia de Bot Explicável** chega a cada decisão.
- Uma **Árvore de Decisão do Bot** pode ter uma **Linha fria** e uma **Linha quente** para a mesma decisão.
- Uma **Estratégia de Bot Explicável** inclui **Decisões de Declaração do Bot** e **Decisões de Jogada do Bot**.
- Uma **Decisão de Jogada do Bot** pode usar **Escolha de vencedora por necessidade** ou **Descarte por necessidade**.
- Uma **Decisão de Jogada do Bot** parte de uma **Leitura da Mesa** única, compartilhada pela **Linha fria** e pela **Linha quente**.
- Uma **Decisão de Jogada do Bot** considera a **Posição na Mesa** antes de avaliar a força da carta.
- Uma **Decisão de Jogada do Bot** no meio da mesa considera se há **Jogadores por agir** que ainda precisam fazer ou já cumpriram.

## Example dialogue

> **Dev:** "Se um jogador declarou 2 e fez 0, ele perde 2 pontos ao fim da rodada?"
> **Especialista:** "Sim. A perda é a diferença absoluta entre declarado e feito, e só então verificamos se ele foi eliminado."

## Flagged ambiguities

- `turno` é usado em sentido amplo: inclui o **Turno 0** de declaração e os **Turnos 1..N** de jogada.
- `G[N-X]` e `P[N-X]` são aliases técnicos; na linguagem de produto use **Escolha de vencedora por necessidade** e **Descarte por necessidade**.
