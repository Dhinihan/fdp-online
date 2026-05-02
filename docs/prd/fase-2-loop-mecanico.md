# PRD — Fase 2: Loop Mecânico

> Resultado da sessão grill-me entre Vinícius e Hermes.
> Data: 2026-05-02

## Problem Statement

Atualmente o jogo FDP tem um placeholder visual (1 carta que vira ao toque), mas não tem regras de jogo. O core (`src/core/`) está vazio. Não existe baralho, distribuição, turnos, nem lógica de quem vence uma disputa. O jogo não é jogável — é só uma demonstração de input.

## Solution

Criar o **core puro do jogo** com o ciclo básico de 1 rodada: baralho embaralhado via Fisher-Yates, 4 cartas distribuídas para 4 jogadores, 4 turnos sequenciais onde cada jogador joga 1 carta, e o core determina o vencedor de cada turno (maior carta segundo a hierarquia FDP, sem manilha). O adapter Phaser é expandido para renderizar 4 mãos, mesa central com cartas jogadas, indicador de vez e fluxo de seleção de carta com 2 cliques. Três bots determinísticos jogam automaticamente.

Ao fim da rodada, o jogo é minimamente jogável: o humano vê suas cartas, escolhe qual jogar, vê os bots jogarem e descobre quem ganhou cada turno.

## User Stories

1. Como jogador, quero clicar em "Jogar" no menu e iniciar uma partida automaticamente, para não precisar configurar nada antes de jogar.
2. Como jogador, quero ver 4 cartas na minha mão ao iniciar a rodada, para saber quais opções tenho.
3. Como jogador, quero ver os outros 3 jogadores (bots) posicionados ao redor da mesa com suas mãos ocultas, para ter a sensação de um jogo de 4 pessoas.
4. Como jogador, quero ver um indicador visual de quem é a vez, para saber quando devo jogar e quando esperar.
5. Como jogador, quero clicar em uma carta da minha mão para selecioná-la (highlight), para indicar qual pretendo jogar.
6. Como jogador, quero clicar novamente na carta selecionada para confirmar a jogada, para evitar jogar a carta errada sem querer.
7. Como jogador, quero clicar em outra carta para trocar a seleção, para corrigir minha escolha antes de confirmar.
8. Como jogador, quero clicar no fundo da tela para desmarcar a carta selecionada, para voltar atrás sem selecionar nenhuma.
9. Como jogador, quero ver minha carta aparecer na mesa após confirmar a jogada, para ter feedback visual imediato.
10. Como jogador, quero ver os bots jogarem suas cartas automaticamente um após o outro, para acompanhar o fluxo do turno.
11. Como jogador, quero ver as 4 cartas jogadas na mesa central ao fim de cada turno, para entender o que cada um jogou.
12. Como jogador, quero saber quem venceu cada turno, para acompanhar o placar da rodada.
13. Como jogador, quero ver as cartas da mesa serem recolhidas pelo vencedor do turno, para entender o conceito de vaza.
14. Como jogador, quero ver a rodada se repetir por 4 turnos completos, para experimentar o ciclo completo de uma rodada.
15. Como jogador, quero ver uma mensagem de "Rodada concluída" ao fim dos 4 turnos, para saber que o ciclo terminou.
16. Como desenvolvedor, quero que o core funcione independente do Phaser, para poder trocar de engine no futuro.
17. Como desenvolvedor, quero que bots e humanos usem a mesma interface de decisão (`DecisorJogada`), para poder trocar a IA sem mexer no core.
18. Como desenvolvedor, quero testes unitários no core (TDD), para ter confiança de que as regras estão corretas.

## Implementation Decisions

### Arquitetura

- **Core puro (TypeScript, sem Phaser):** `src/core/` contém `Carta`, `Baralho`, `Partida` e a porta `DecisorJogada`. Zero imports do Phaser.
- **Porta de decisão (`DecisorJogada`):** Interface com método `decidirJogada(mao: Carta[], estado: EstadoPartida): Promise<Carta>`. O core chama igual para humano e bot — não sabe diferenciar.
- **State machine com 5 fases:** `distribuindo → aguardandoJogada → processandoTurno → turnoConcluido → rodadaConcluida`. A fase `aguardandoJogada` se repete até os 4 jogadores terem jogado. `jogadorAtual` é dado do estado, não sub-estado.
- **Eventos de domínio:** O core emite eventos imutáveis (`CARTAS_DISTRIBUIDAS`, `VEZ_DO_JOGADOR`, `CARTA_JOGADA`, `TURNO_GANHO`, `RODADA_ENCERRADA`). O adapter consome e renderiza.
- **Adapter nunca decide regras:** O adapter Phaser apenas renderiza o estado público do core e captura input do jogador. O vencedor do turno é calculado exclusivamente pelo core.

### Módulos novos

| Módulo | Responsabilidade |
|--------|-----------------|
| `src/core/Carta.ts` | `compararValor(a, b)`, `compararNaipe(a, b)` — hierarquia fixa 3>2>A>K>Q>J>10>9>8>7>6>5>4, naipes ♣>♥>♠>♦ |
| `src/core/Baralho.ts` | `criarBaralho()`, `embaralhar()` (Fisher-Yates), `distribuir(quantidade, jogadores)` |
| `src/core/portas/DecisorJogada.ts` | Interface assíncrona que injeta a decisão do jogador no core |
| `src/core/Partida.ts` | State machine, orquestração de turnos, chamada ao `DecisorJogada`, emissão de eventos de domínio |
| `src/types/estado-partida.ts` | Tipo `EstadoPartida`: `fase`, `jogadorAtual`, `mao`, `mesa`, `vazas`, `vencedorDoTurno` |

### Módulos modificados

| Módulo | Mudança |
|--------|---------|
| `src/types/eventos-dominio.ts` | Adicionar `CartasDistribuidas`, `VezDoJogador` |
| `src/adapters/phaser/scenes/JogoScene.ts` | Substituir 1 carta placeholder por 4 mãos + mesa + indicador de vez + fluxo seleção/confirma |

### Módulos novos no adapter

| Módulo | Responsabilidade |
|--------|-----------------|
| `src/adapters/bots/BotDeterministico.ts` | Implementa `DecisorJogada`, sempre joga a carta de menor valor da mão |
| `src/adapters/phaser/DecisorHumano.ts` | Implementa `DecisorJogada`, aguarda input do jogador (2 cliques) e resolve a Promise |

### Fluxo de interação humano

1. Clique na carta → seleciona (highlight visual)
2. Clique na mesma carta → confirma jogada, emite evento pro core
3. Clique em outra carta → troca seleção
4. Clique no fundo → desmarca sem selecionar

### Layout da mesa

```
         [Bot 2]  ← mão oculta (verso)
[Bot 3]          [Bot 1]  ← mãos ocultas
        [VOCÊ]   ← mão visível (frente)
```

- Mesa central: 4 cartas jogadas no turno atual
- Indicador de vez: destaque visual no jogador ativo

### Bots

- 3 bots determinísticos: sempre jogam a carta de menor valor da mão
- A hierarquia usada é a do jogo: 4 é a mais baixa, 3 é a mais alta
- Sem capacidade de declaração (Fase 3)

### Início da partida

- Menu → clica "Jogar" → core inicializa automaticamente (cria baralho, embaralha, distribui, define ordem)
- Ordem: você joga primeiro, bots em sequência
- Sem tela de setup, sem escolha de avatar

## Testing Decisions

### O que testar (TDD no core)

- `Carta.ts`: `compararValor` com todos os pares da hierarquia, `compararNaipe` com desempate
- `Baralho.ts`: baralho criado com 52 cartas, Fisher-Yates produz permutação, distribuir lança erro se cartas insuficientes
- `Partida.ts`: state machine transita corretamente entre fases, vencedor do turno é calculado certo, vazas acumulam corretamente, rodada encerra após 4 turnos
- `BotDeterministico.ts`: sempre retorna a carta de menor valor, lança erro se mão vazia

### O que NÃO testar com TDD

- `DecisorHumano.ts` — depende de input do jogador. Cobertura futura via Playwright/E2E.
- `JogoScene.ts` (adapter Phaser) — regressão visual futura via Playwright, não agora.

### O que faz um bom teste

- Testa comportamento externo, não implementação interna
- Um teste = um cenário
- Nomes em português descritivos (ex: `deve retornar true quando 3 compara com 2`)

## Out of Scope

- Manilha (Fase 3)
- Declaração / Turno 0 (Fase 3)
- Pontuação e eliminação (Fase 3)
- Regra especial da 1ª rodada (Fase 3)
- Múltiplas rodadas (Fase 3)
- Bots com estratégias variadas (Fase 4)
- Sprites reais de cartas (Fase 5)
- Animações de distribuição e jogada (Fase 5)
- SFX completos (Fase 5)
- Menu com nome do jogo e regras (Fase 5)
- Tela de fim de jogo (Fase 5)
- PWA e persistência (Fase 6)

## Further Notes

- A Fase 1 está concluída e serve de base: o Phaser já renderiza carta, responde a toque, toca SFX e tem menu com botão "Jogar".
- O `CONTEXT.md` foi atualizado com o termo **Vaza** durante esta sessão.
- O `FASES.md` foi corrigido: distribuição de **4 cartas** (não 1) para 4 jogadores.
- O código usa português brasileiro para nomes de variáveis, funções e classes.
- Todo código do core exige TDD obrigatório (1 teste → 1 implementação).
