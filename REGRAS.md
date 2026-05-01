# REGRAS — FDP

Versão enxuta e canônica das regras do jogo FDP.

## Objetivo da partida

- Vence quem for o **último jogador com pontos positivos**.
- Todos começam com **5 pontos**.
- Os pontos **apenas diminuem**.
- A partida termina quando **apenas um jogador** tem pontos maiores que zero.

## Preparação e ordem

- O jogo usa **baralho padrão de 52 cartas**.
- Na primeira rodada, **sorteia-se quem começa**.
- Na revanche, **o ganhador fica por último** na ordem da primeira rodada.
- A ordem de jogo é **anti-horária**.
- O **último jogador sempre embaralha** o baralho.

## Estrutura da rodada

- Na **rodada N**, cada jogador recebe **N cartas**.
- O máximo é **13 cartas por jogador**.
- Exemplo: rodada 1 → 1 carta cada; rodada 2 → 2 cartas cada; …; rodada 13 → 13 cartas cada.
- Se um jogador for eliminado ao final da rodada, a próxima rodada **volta para N = 1**.

## Manilha e hierarquia

- O embaralhador vira **uma carta do baralho**.
- O próximo valor na sequência define a **manilha** da rodada.
- Se não houver carta para virar, a **manilha é 3**.
- Hierarquia de valores, do maior para o menor:
  - **3 > 2 > A > K > Q > J > 10 > 9 > 8 > 7 > 6 > 5 > 4**
- Hierarquia de naipes, do maior para o menor:
  - **Paus > Copas > Espadas > Ouros**
- A **manilha sempre vence** cartas que não são manilha.
- Entre manilhas, o **naipe** desempata.

## Declaração

- No **Turno 0**, cada jogador declara **quantos turnos pretende fazer** na rodada.
- A declaração segue a ordem **anti-horária**.
- **Não há restrição** na soma dos palpites.
- O **último jogador também não tem restrição especial**.
- É permitido declarar **0**.

## Resolução dos turnos

- Nos **Turnos 1 a N**, o primeiro jogador joga **uma carta aberta** na mesa.
- Os demais seguem em ordem anti-horária, jogando **uma carta aberta** cada.
- **Não há obrigação de seguir naipe**.
- Quem jogar a **carta mais alta** **faz o turno**.
- Quem faz o turno se torna o **primeiro no próximo turno**.
- Empates:
  - entre **manilhas**, o **naipe** desempata;
  - entre **cartas não-manilha do mesmo valor**, **ninguém faz o turno**, e o **último empatado** começa o próximo turno.

## Pontuação e eliminação

- Ao final da rodada, cada jogador perde pontos conforme a fórmula:
  - **|declarado − feito| = pontos perdidos**
- Exemplos:
  - declarou 3 e fez 3 → perde 0;
  - declarou 3 e fez 1 → perde 2;
  - declarou 0 e fez 2 → perde 2;
  - declarou 5 e fez 2 → perde 3.
- Um jogador é **eliminado** quando termina a rodada com **0 pontos ou menos**.
- A eliminação ocorre **apenas ao final da rodada**, nunca no meio dela.
- Jogadores eliminados **não participam** das rodadas seguintes.
- Se alguém for eliminado, a contagem da próxima rodada **reinicia em 1**.
- Se múltiplos jogadores zerarem na mesma rodada, eles podem acumular pontos negativos até que o vencedor tenha **estritamente mais pontos** que todos os outros.

## Casos especiais

### Primeira rodada

- Na primeira rodada, **você não vê a sua própria carta**.
- Na primeira rodada, **você vê as cartas de todos os outros jogadores**.
