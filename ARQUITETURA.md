# Arquitetura do FDP

> Decisões arquiteturais do projeto FDP (Faz De Propósito).
> Este documento é resultado das sessões grill-me entre Hermes e Vinícius.
> Data da última revisão: 2026-04-23

---

## Visão Geral

Jogo de cartas brasileiro (baralho padrão de 52 cartas), gratuito, open-source, rodando no browser.

| Aspecto | Decisão |
|---|---|
| **Escopo do MVP** | Single-player contra bots (IA com temperatura) |
| **Multiplayer** | Não no MVP. Arquitetura pronta para substituir a camada de transporte no futuro |
| **Público** | Mobile-first, PWA instalável |
| **Idiomas** | PT-BR (código + docs), EN e ES (interface) |

---

## Stack

| Camada | Ferramenta | Motivação |
|---|---|---|
| Linguagem | TypeScript | Tipagem estática, DX |
| Build | Vite | Rápido, HMR, TS nativo, integração com Vercel |
| Package manager | pnpm | Mais rápido que npm/yarn |
| Game engine | Phaser 3 | Padrão de mercado para jogos 2D no browser, ecossistema maduro |
| Testes unitários | Vitest | TS nativo, rápido, integrado com Vite |
| Testes E2E | Playwright | Maturidade, screenshots de regressão, interação com canvas |
| CI/CD | GitHub Actions + Vercel | Testes antes de deploy |

---

## Arquitetura em Camadas (Ports & Adapters / Clean Architecture)

O core do jogo **não sabe que o Phaser existe**. Isso permite trocar a engine no futuro sem reescrever regras.

```mermaid
flowchart TB
    subgraph Adapter["Adapter (Phaser 3)"]
        direction TB
        Scenes["Scenes"]
        Render["Renderer"]
        Sprites["Sprites / Tweens"]
        Input["Input (tap / drag)"]
    end

    Store["Store / Event Emitter"]

    subgraph Core["Core (TypeScript puro)"]
        direction TB
        Entities["Entities<br/>Carta, Baralho, Jogador"]
        UseCases["Use Cases<br/>iniciarJogo, jogarTurno, calcularPontuacao"]
        StateMachine["State Machine<br/>PREP → DECLARAR → JOGAR"]
        IA["IA dos Bots<br/>(temperatura fria / quente)"]
        Eventos["Eventos<br/>(log imutável)"]
    end

    Core -->|"emite eventos"| Store
    Store -->|"consome & renderiza"| Adapter
```

### Estrutura de Pastas

```
src/
  core/              ← Regras puras do FDP (sem Phaser!)
    entities/        ← Carta, Baralho, Jogador, EstadoJogo
    use-cases/       ← iniciarJogo, jogarTurno, calcularPontuacao
    events/          ← Tipos de eventos (CARTA_JOGADA, FASE_MUDOU, etc.)
    state-machine/   ← Fases do jogo (PREP, DECLARAR, JOGAR)
  adapters/
    phaser/          ← Tudo que toca Phaser
      scenes/        ← BootScene, GameScene, UIScene
      renderers/     ← Desenha cartas, anima jogadas
      input/         ← Toque, clique
    bots/            ← IA com temperatura (injetada no core)
  store/             ← Event Emitter + estado reativo
  types/             ← Tipos compartilhados
tests/
  core/              ← Vitest: regras puras
  e2e/               ← Playwright: fluxo completo
```

---

## Estado e Eventos

- **Store reativa simples com Event Emitter custom.**
- O core emite eventos imutáveis; o adapter consome e renderiza.
- No futuro multiplayer, o host emite os mesmos eventos pela rede.

Eventos principais:
- `JOGO_INICIADO`
- `MANILHA_VIRADA`
- `DECLARACAO_FEITA`
- `CARTA_JOGADA`
- `TURNO_GANHO`
- `RODADA_ENCERRADA`
- `JOGO_ENCERRADO`

---

## IA dos Bots

- **Heurística + aleatoriedade (temperatura).**
- "Frio" = sempre a jogada mais conservadora.
- "Quente" = arrisca mais (blefa, força adversário, espera).
- Detalhes do algoritmo serão definidos na implementação.

---

## Testes

### Estratégia de 3 Camadas

| Camada | Ferramenta | O que testa |
|---|---|---|
| **Unitário** | Vitest | Core puro (regras, state machine, eventos) |
| **E2E fluxo** | Playwright | 1 fluxo completo determinístico com seed fixa |
| **Regressão visual** | Playwright screenshots | Canvas em momentos chave |

### TDD

- **Core**: TDD desde o início (slices verticais: 1 teste → 1 implementação → repete).
- **Adapter**: não TDD. Testes via E2E e screenshots.

### Seed Fixa nos Testes E2E

`VITE_TEST_SEED=1337` garante reprodutibilidade (mesmo baralho, mesma sequência).

---

## Qualidade de Código

| Ferramenta | Regra / Propósito |
|---|---|
| **ESLint + typescript-eslint** | Complexidade máxima: 10, arquivo máx: 200 linhas, função máx: 30 linhas, parâmetros máx: 3 |
| **Prettier** | Formatação automática |
| **Knip** | Detecta dependências e código morto |
| **Dependabot** | Atualiza dependências automaticamente (PRs) |
| **Husky + lint-staged** | Pre-commit: Prettier + ESLint + typecheck + testes |

---

## Assets e Interface

| Aspecto | Decisão |
|---|---|
| **Sprites** | Assets gratuitos do Kenney (escolhidos na implementação) |
| **Estilo fallback** | Minimalista programático (retângulos, texto, cores) enquanto assets não estão prontos |
| **Interação** | Tap para selecionar carta → tap na mesa/botão para jogar (mobile-first) |
| **Som** | SFX simples (clique, distribuir, virar manilha, vitória). Sem música ambiente no MVP |
| **Persistência** | localStorage (estatísticas + preferências) |

---

## PWA

- Manifest JSON e service worker via Vite PWA plugin.
- Instalável no celular, ícone na home screen.

---

## Workflow de Desenvolvimento

```mermaid
flowchart LR
    V["Vinícius<br/>(dono do produto)"]
    H["Hermes<br/>(orquestrador)"]
    P["Pi CLI<br/>(coding agent)"]
    G["GitHub<br/>(repo & PRs)"]

    V <-->|"grill-me: define fases"| H
    H <-->|"grill-me: define issues"| H
    H -->|"delega implementação"| P
    P -->|"abre PR"| G
    G -->|"revisa PR"| V
    V -->|"feedback da revisão"| H
    H -->|"devolve ao Pi"| P
```

1. **Sessões grill-me** entre Vinícius e Hermes definem fases e issues.
2. **Hermes** orquestra o Pi CLI para implementar cada issue.
3. **Pi** abre PRs no GitHub.
4. **Vinícius** revisa PRs diretamente no GitHub.
5. **Hermes** recebe feedback e devolve ao Pi.

---

## Decisões Arquiteturais Rejeitadas

| Alternativa | Motivo da rejeição |
|---|---|
| Multiplayer no MVP | Overhead de anti-cheat e sinalização P2P. Arquitetura já permite adicionar depois |
| Framework UI (React/Vue) | Overkill para jogo de cartas. Phaser já gerencia input e renderização |
| ECS no core | Overkill para entidades contáveis (52 cartas + 4 jogadores). ECS fica para próximo jogo |
| IndexedDB | localStorage é suficiente para estatísticas e preferências |
| MCTS/MiniMax para bots | Informação parcial + embaralhamento torna custo computacional não justificável |
