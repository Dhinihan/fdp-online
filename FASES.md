# Fases do MVP — FDP (Faz De Propósito)

> Opção B: Entregáveis Verticais. Cada fase entrega uma experiência jogável.
> Atualizado em: 2026-04-23

---

## Legenda

- `[ ]` — Não iniciado
- `[~]` — Em andamento
- `[x]` — Concluído

---

## Fase 0 — Infraestrutura

**Objetivo:** Provar que a stack funciona end-to-end.

**Entregáveis:**
- [ ] Projeto Vite + TypeScript configurado
- [ ] Phaser 3 instalado e renderizando algo na tela
- [ ] Vitest configurado com pelo menos 1 teste passando
- [ ] ESLint + Prettier configurados
- [ ] Husky + lint-staged no pre-commit
- [ ] Quadrado verde (ou carta placeholder) aparece no canvas ao rodar `pnpm dev`
- [ ] `pnpm test` passa no CI (GitHub Actions)

**Valida:** A stack funciona. Build, testes, lint e CI estão conversando.

---

## Fase 1 — Toque e Resposta

**Objetivo:** O Phaser responde ao input mobile. Primeira dopamina.

**Entregáveis:**
- [ ] Carta placeholder renderizada na tela (sprite ou retângulo)
- [ ] Toque na carta dispara evento
- [ ] Carta "vira" (troca de sprite ou animação simples) ao tocar
- [ ] Som ao tocar (SFX placeholder)
- [ ] Menu inicial básico (botão "Jogar")
- [ ] Tela reage corretamente a resize/orientação mobile

**Valida:** O adapter Phaser recebe input e dá feedback visual/sonoro.

**Regras Fortalecidas:** A interação apenas emite eventos. O estado da carta (virada/não virada) pode ser mentira visual — o core ainda não existe.

---

## Fase 2 — Loop Mecânico

**Objetivo:** O core aguenta o ciclo básico de turnos.

**Entregáveis:**
- [ ] Entidade `Carta` (valor, naipe) no core com testes
- [ ] Entidade `Baralho` com Fisher-Yates e testes
- [ ] Distribuição de 1 carta para 4 jogadores
- [ ] 1 turno: cada jogador joga 1 carta na mesa
- [ ] Determinação do vencedor do turno (maior carta, sem manilha ainda)
- [ ] Estado do jogo mantido entre turnos
- [ ] 1 rodada completa (4 turnos)
- [ ] Interface mostra cartas na mão e cartas jogadas na mesa

**Valida:** O core separado do adapter funciona. State machine básica opera.

**Regras Fortalecidas:**
- Adapter nunca decide quem ganhou. O core calcula e expõe `vencedorDoTurno` no estado.
- Adapter apenas renderiza o que o core manda.

---

## Fase 3 — Regras Completas do FDP

**Objetivo:** O core aguenta todas as regras reais do jogo.

**Entregáveis:**
- [ ] Preparação: virar carta para definir manilha
- [ ] Hierarquia completa: valores (3>2>A>K>Q>J>7>6>5>4) + naipes (♣>♥>♠>♦)
- [ ] Turno 0 — Declaração: cada jogador diz quantos turnos vai fazer
- [ ] Pontuação: `|declarado − feito|` aplicada ao final da rodada
- [ ] Eliminação: jogador com ≤0 pontos sai do jogo
- [ ] Regra especial da 1ª rodada: jogador não vê própria carta, vê dos outros
- [ ] Reinício em N=1 quando alguém é eliminado
- [ ] Jogo termina quando apenas 1 jogador tem pontos > 0
- [ ] Loop de múltiplas rodadas (até N=13 ou eliminação)

**Valida:** O core é robusto o suficiente para o FDP real.

**Regras Fortalecidas:**
- Toda informação que o adapter precisa (manilha atual, pontos, declarações) passa pelo estado público do core.
- Adapter não calcula pontuação, não decide eliminação.

---

## Fase 4 — Bots com Temperatura

**Objetivo:** A arquitetura de IA é extensível.

**Entregáveis:**
- [ ] Interface `EstrategiaBot` (port) no core
- [ ] Bot Aleatório ( já existe da Fase 2, agora formalizado)
- [ ] Bot Frio: joga a carta mínima necessária para ganhar o turno
- [ ] Bot Quente: arrisca, blefa, força adversário
- [ ] Bot consegue declarar palpite (Turno 0) com lógica própria
- [ ] Diferença visível no comportamento entre Frio e Quente

**Valida:** A arquitetura de ports permite trocar a IA sem mexer no core.

**Regras Fortalecidas:**
- A estratégia é injetada no core como port. O core não sabe se é bot ou humano.
- Adapter não escolhe jogada do bot. O core pede a jogada ao bot via interface.

---

## Fase 5 — UI/UX e Polimento

**Objetivo:** O adapter Phaser resiste à complexidade visual.

**Entregáveis:**
- [ ] Sprites de cartas (Kenney ou similar)
- [ ] Animação de distribuição (carta saindo do baralho pra mão)
- [ ] Animação de jogada (carta deslizando pra mesa)
- [ ] SFX completos: clique, distribuir, virar manilha, vitória, derrota
- [ ] Menu inicial com nome do jogo, botão Jogar, regras resumidas
- [ ] Tela de fim de jogo com ranking
- [ ] Escolha de avatar/nome
- [ ] Indicador visual de quem é o jogador atual
- [ ] Mesa com posições dos 4 jogadores visíveis

**Valida:** O adapter consegue renderizar tudo que o core manda, de forma bonita.

**Regras Fortalecidas:**
- Animações são mentira visual permitida. Nunca mudam estado.
- Adapter pode enriquecer o estado visualmente, mas a fonte da verdade é sempre o core.

---

## Fase 6 — PWA e Persistência

**Objetivo:** A entrega funciona fora do desktop.

**Entregáveis:**
- [ ] Service worker configurado (Vite PWA plugin)
- [ ] Funciona offline (jogo single-player roda sem internet)
- [ ] Manifest JSON com ícone, nome, descrição
- [ ] Instalável no celular ("Adicionar à tela inicial")
- [ ] localStorage: estatísticas de partidas (vitórias, derrotas, streak)
- [ ] localStorage: preferências (som ligado/desligado, avatar escolhido)
- [ ] Tela de estatísticas acessível do menu

**Valida:** O produto é um app completo, não apenas uma página web.

---

## Após o MVP

- Multiplayer P2P via WebRTC
- MCTS/MiniMax para bots avançados
- Leaderboard online
- Temas visuais (baralhos diferentes)
- Modo torneio

---

## Notas

- Cada fase é uma **fatia vertical**. O que importa é entregar algo jogável, ainda que incompleto.
- As **Regras Fortalecidas** (ver `ARQUITETURA.md`) se aplicam desde a Fase 1.
- O Pi CLI deve ler `ARQUITETURA.md` e `AGENTS.md` antes de implementar qualquer fase.
