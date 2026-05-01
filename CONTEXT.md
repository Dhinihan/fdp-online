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

## Relationships

- Uma **Partida** contém uma ou mais **Rodadas**.
- Uma **Rodada** contém um **Turno 0** de declaração e **N Turnos** de jogada.
- Cada jogador registra um **Declarado** e um **Feito** em cada **Rodada**.
- Cada **Rodada** define uma **Manilha**.
- A diferença absoluta entre **Declarado** e **Feito** reduz os **Pontos** do jogador ao final da **Rodada**.
- Um jogador com **Pontos** menores ou iguais a zero ao final da **Rodada** se torna um **Jogador eliminado**.

## Example dialogue

> **Dev:** "Se um jogador declarou 2 e fez 0, ele perde 2 pontos ao fim da rodada?"
> **Especialista:** "Sim. A perda é a diferença absoluta entre declarado e feito, e só então verificamos se ele foi eliminado."

## Flagged ambiguities

- `turno` é usado em sentido amplo: inclui o **Turno 0** de declaração e os **Turnos 1..N** de jogada.
