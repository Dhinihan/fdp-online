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

**Perfil de Bot**:
Identidade reconhecível de um bot entre partidas, definida pelo nome e pela faixa de temperatura estratégica, independentemente do assento temporário ocupado na **Partida**.
_Avoid_: Slot de bot, bot1, bot2, bot3

**Ranking**:
Classificação persistida de desempenho dos participantes reconhecíveis entre **Partidas**, agregando o jogador humano e cada **Perfil de Bot**.
_Avoid_: Leaderboard, placar, ranking da partida, placar da rodada

**Vitória de Partida**:
Resultado atribuído somente ao primeiro colocado da **Partida** encerrada.
_Avoid_: Vitória de rodada, vaza vencida, turno ganho

**Classificação da Partida**:
Ordem final dos participantes ao encerrar uma **Partida**, definida por sobrevivência: vencedor primeiro, depois **Jogadores eliminados** do mais recente para o mais antigo. Entre jogadores eliminados no mesmo fechamento de **Rodada**, vence quem ficou com mais **Pontos**; em empate de **Pontos**, o jogador humano fica acima dos **Perfis de Bot**.
_Avoid_: Tabela final, ranking visual, placar final

**Sequência de Vitórias**:
Quantidade de **Vitórias de Partida** consecutivas do jogador humano. Incrementa a cada **Partida** concluída em que o humano termina como vencedor e zera quando ele encerra uma **Partida** em qualquer outra posição. Abandonar uma **Partida** sem concluí-la não afeta a sequência. Exclusiva do jogador humano.
_Avoid_: Winstreak, streak, combo

**Troféu**:
Marco persistente conquistado pelo jogador humano ao atingir um comprimento de **Sequência de Vitórias**. Uma vez conquistado, nunca é perdido, mesmo quando a **Sequência de Vitórias** zera. São sete níveis ordenados — Bronze (3), Prata (5), Ouro (10), Esmeralda (15), Safira (25), Rubi (50), Diamante (100) — e cada nível é conquistado uma única vez. Exclusivo do jogador humano.
_Avoid_: Milestone, conquista, achievement, medalha

**Maior Troféu**:
**Troféu** de nível mais alto já conquistado pelo jogador humano. Resume toda a coleção, já que os níveis são ordenados: possuir um nível implica possuir todos os anteriores.
_Avoid_: Melhor sequência, recorde

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
- Um **Ranking** agrega estatísticas por participante reconhecível: o jogador humano e cada **Perfil de Bot**.
- Um **Perfil de Bot** pode ocupar assentos temporários diferentes em **Partidas** diferentes sem mudar sua identidade no **Ranking**.
- O win rate no **Ranking** é calculado por **Vitórias de Partida** divididas pelas **Partidas** computadas em que o participante apareceu.
- A **Classificação da Partida** define a **Vitória de Partida** e a posição registrada no **Ranking**.
- O **Ranking** registra apenas **Partidas** concluídas e exibe **Perfis de Bot** somente depois que aparecem em pelo menos uma **Partida** computada.
- Uma **Vitória de Partida** do jogador humano incrementa a **Sequência de Vitórias**; qualquer outra **Classificação da Partida** dele a zera.
- Atingir um comprimento de marco na **Sequência de Vitórias** conquista o **Troféu** correspondente, atualizando o **Maior Troféu**.
- Um **Troféu** de nível já contido no **Maior Troféu** não é reconquistado: o próximo desbloqueio só ocorre no nível acima do **Maior Troféu**.
- A **Sequência de Vitórias** e o **Maior Troféu** são atualizados no mesmo encerramento de **Partida** que alimenta o **Ranking**, mas pertencem só ao jogador humano.

## Example dialogue

> **Dev:** "Se um jogador declarou 2 e fez 0, ele perde 2 pontos ao fim da rodada?"
> **Especialista:** "Sim. A perda é a diferença absoluta entre declarado e feito, e só então verificamos se ele foi eliminado."

## Flagged ambiguities

- `turno` é usado em sentido amplo: inclui o **Turno 0** de declaração e os **Turnos 1..N** de jogada.
- `G[N-X]` e `P[N-X]` são aliases técnicos; na linguagem de produto use **Escolha de vencedora por necessidade** e **Descarte por necessidade**.
- `bot1`, `bot2` e `bot3` são assentos técnicos temporários; na linguagem de produto e no **Ranking**, use o **Perfil de Bot**.
- `vitória` no contexto do **Ranking** significa **Vitória de Partida**, não turno feito nem rodada sobrevivida.
- `winstreak`/`streak` é a **Sequência de Vitórias**; `milestone`/`conquista` é um **Troféu**. Ambos são exclusivos do jogador humano, ao contrário do **Ranking**, que agrega humano e **Perfis de Bot**.
