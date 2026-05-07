---
name: play-fdp
description: Ensina o agente a operar o jogo FDP no browser usando browser tools + analyze_image. Inclui como operar o dev server, navegar a UI do Phaser, entender o layout da tela, e inspecionar estado via console. As regras do jogo ficam em REGRAS.md — leia antes de jogar. Use quando o usuário pedir para jogar, testar o jogo manualmente, validar o fluxo visual, ou interagir com a UI do jogo.
---

# Play FDP — Guia Operacional para Agentes

Este skill ensina o agente a **operar** o jogo FDP no browser. Para as regras e estratégia, leia `REGRAS.md`.

---

## 0. Pré-requisito: Regras

Leia `REGRAS.md` antes de jogar. A skill assume conhecimento das regras do jogo.

---

## 1. Subir o Dev Server

```bash
pnpm install   # se necessário
pnpm dev       # sobe em http://localhost:5173 por padrão
```

Confirme a URL no terminal (pode mudar se a porta estiver ocupada).

---

## 2. Interação com o Phaser — Importante

O jogo roda em `<canvas>` via Phaser 3. Isso significa:

- **`snapshot -i` NÃO retorna @refs.** Os elementos visuais não são nós DOM.
- **`click <@ref>` NÃO funciona.** Não há elementos DOM clicáveis.
- **Clicar via coordenadas NÃO funciona.** O Phaser gerencia input internamente, eventos DOM dispatchados não chegam ao engine.

**A única forma confiável de interagir é via `eval` no console**, usando o objeto `window.__jogoPhaser` (disponível apenas em DEV).

O workflow é:

1. `browser: eval <JS>` — ler estado e executar ações
2. `browser: screenshot` + `analyze_image` — interpretar visualmente quando necessário

---

## 3. Layout da Tela — Mapa Visual

```
┌─────────────────────────────────────┐
│           Bot 2 (topo)              │
│         cartas horizontais          │
│                                     │
│  Bot 1         MESA         Bot 3   │
│  (esquerda)  (centro)      (direita)│
│  cartas       ┌──────┐    cartas    │
│  verticais    │cartas│    verticais │
│               │jogada│             │
│               └──────┘             │
│          [Manilha virada]           │
│                                     │
│         Humano (Você, base)         │
│       cartas horizontais            │
└─────────────────────────────────────┘
```

| Jogador           | Índice | Posição                   | Direção cartas | Label na vez     |
| ----------------- | ------ | ------------------------- | -------------- | ---------------- |
| **Humano** (Você) | 0      | Base, centro-inferior     | Horizontal     | Amarelo pulsante |
| **Bot 1**         | 1      | Esquerda, centro vertical | Vertical       | Amarelo pulsante |
| **Bot 2**         | 2      | Topo, centro              | Horizontal     | Amarelo pulsante |
| **Bot 3**         | 3      | Direita, centro vertical  | Vertical       | Amarelo pulsante |

**Indicador de vez:** label do jogador atual fica **amarelo** e pulsa (scale 1.0 → 1.2).

**Manilha:** centro da tela, acima do centro. Mostra a carta virada + texto `Manilha: <valor>`.

**Mesa (cartas jogadas):** centro exato da tela, dispostas horizontalmente.

**Mão do Humano:** base da tela, cartas brancas com texto preto (`valor + naipe`). Cartas dos bots: verso azul escuro.

---

## 4. Fluxo de Jogo — Tudo via `eval`

### 4.1. Helper — Acessar o estado

Use este padrão para ler o estado. **Reutilize nomes de variáveis com cuidado** — o browser tool mantém o escopo entre eval calls. Use nomes únicos a cada consulta:

```
browser: eval JSON.stringify({fase: window.__jogoPhaser.scene.getScene('JogoScene').rodada.estado.fase, jogadorAtual: window.__jogoPhaser.scene.getScene('JogoScene').rodada.estado.jogadorAtual})
```

Para simplificar, grave a scene numa variável de letra única diferente a cada consulta:

```
browser: eval const A = window.__jogoPhaser.scene.getScene('JogoScene'); JSON.stringify({fase: A.rodada.estado.fase, jogadorAtual: A.rodada.estado.jogadorAtual, minhasCartas: A.rodada.estado.maos[0].cartas, manilha: A.rodada.estado.manilha, mesa: A.rodada.estado.mesa, vazas: A.rodada.estado.vazas, declaracoes: A.rodada.estado.declaracoes, turno: A.rodada.estado.turno, cartasPorRodada: A.rodada.estado.cartasPorRodada})
```

**Atenção:** não reutilize o nome da variável (`A`, `B`, etc.) entre eval calls — isso causa `SyntaxError: Identifier already declared`. Use letras diferentes (`A`, `B`, `C`...) ou nomes descritivos únicos.

### 4.2. Iniciar a Partida (pular o menu)

O menu tem um botão "Jogar" mas não é clicável via browser tools. Pule direto para o jogo:

```
browser: eval window.__jogoPhaser.scene.getScene('MenuScene').scene.start('JogoScene'); 'ok'
browser: wait 1500
```

### 4.3. Fase de Declaração

Quando `fase` for `processandoDeclaracao` e `jogadorAtual` for `0`, é sua vez de declarar.

**Declarar um valor:**

```
browser: eval window.__jogoPhaser.scene.getScene('JogoScene').decisorDeclaracaoHumano.confirmar(<VALOR>); 'declarado'
```

Exemplo — declarar 2:

```
browser: eval window.__jogoPhaser.scene.getScene('JogoScene').decisorDeclaracaoHumano.confirmar(2); 'declarado 2'
```

Após declarar, os bots declaram automaticamente (400ms cada). Aguarde:

```
browser: wait 2000
```

### 4.4. Fase de Jogada (Turnos 1 a N)

Quando `fase` for `processandoTurno` ou `aguardandoJogada` e `jogadorAtual` for `0`, é sua vez de jogar.

**Selecionar carta e confirmar (tudo em uma chamada):**

```
browser: eval window.__jogoPhaser.scene.getScene('JogoScene').decisorHumano.selecionar({valor: '<VALOR>', naipe: '<NAIPE>'}); window.__jogoPhaser.scene.getScene('JogoScene').decisorHumano.confirmar(); 'joguei <VALOR><NAIPE>'
```

Exemplo — jogar K♠:

```
browser: eval window.__jogoPhaser.scene.getScene('JogoScene').decisorHumano.selecionar({valor: 'K', naipe: '♠'}); window.__jogoPhaser.scene.getScene('JogoScene').decisorHumano.confirmar(); 'joguei K♠'
```

Naipes: `♣` `♥` `♠` `♦`.

Após jogar, os bots jogam automaticamente (500ms cada). Aguarde:

```
browser: wait 2000
```

### 4.5. Fim da Rodada

Quando `fase` for `rodadaConcluida`, a rodada acabou. Um overlay preto com **"Rodada concluída"** aparece no centro da tela.

Neste ponto, tire um screenshot para comprovar:

```
browser: screenshot
```

### 4.6. Loop Completo de Uma Rodada

```
# 1. Subir dev server
pnpm dev

# 2. Abrir no browser
browser: open http://localhost:5173

# 3. Pular menu e entrar no jogo
browser: eval window.__jogoPhaser.scene.getScene('MenuScene').scene.start('JogoScene'); 'ok'
browser: wait 1500

# 4. Ler estado inicial (manilha, cartas, fase)
browser: eval const A = window.__jogoPhaser.scene.getScene('JogoScene'); JSON.stringify({fase: A.rodada.estado.fase, manilha: A.rodada.estado.manilha, cartaVirada: A.rodada.estado.cartaVirada, minhasCartas: A.rodada.estado.maos[0].cartas, cartasPorRodada: A.rodada.estado.cartasPorRodada})

# 5. Declarar (quando for sua vez)
browser: eval window.__jogoPhaser.scene.getScene('JogoScene').decisorDeclaracaoHumano.confirmar(<VALOR>); 'declarado'
browser: wait 2000

# 6. Loop: ler estado → jogar carta → esperar (repetir até rodadaConcluida)
browser: eval const B = window.__jogoPhaser.scene.getScene('JogoScene'); JSON.stringify({fase: B.rodada.estado.fase, jogadorAtual: B.rodada.estado.jogadorAtual, minhasCartas: B.rodada.estado.maos[0].cartas, mesa: B.rodada.estado.mesa, vazas: B.rodada.estado.vazas})

browser: eval window.__jogoPhaser.scene.getScene('JogoScene').decisorHumano.selecionar({valor: '<VALOR>', naipe: '<NAIPE>'}); window.__jogoPhaser.scene.getScene('JogoScene').decisorHumano.confirmar(); 'joguei'
browser: wait 2000

# 7. Confirmar fim da rodada
browser: eval const C = window.__jogoPhaser.scene.getScene('JogoScene'); JSON.stringify({fase: C.rodada.estado.fase, vazas: C.rodada.estado.vazas, declaracoes: C.rodada.estado.declaracoes})
browser: screenshot
```

---

## 5. Leitura Visual com analyze_image

Use `analyze_image` para interpretar screenshots quando quiser confirmar visualmente o estado da tela (útil para validar renders, overlays, animações).

```
browser: screenshot
analyze_image(image_path=<caminho_retornado>, question="...")
```

### Perguntas Úteis

| Situação          | Pergunta                                                                        |
| ----------------- | ------------------------------------------------------------------------------- |
| Confirmar fase    | "Há overlay de 'Rodada concluída'? Ou botões de declaração? Ou cartas na mesa?" |
| Ver render visual | "Os labels dos jogadores estão visíveis? A manilha aparece corretamente?"       |
| Validar overlay   | "Que texto aparece no overlay central?"                                         |

**Nota:** para **decisões de jogo**, prefira sempre `eval` (leitura exata do estado) sobre `analyze_image` (interpretação visual aproximada).

---

## 6. Referência do Estado via `eval`

### 6.1. Acessar

```javascript
window.__jogoPhaser.scene.getScene('JogoScene').rodada.estado;
```

### 6.2. Campos

| Campo             | Tipo       | Descrição                                                                                                                  |
| ----------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------- |
| `fase`            | string     | `distribuindo`, `aguardandoDeclaracao`, `processandoDeclaracao`, `aguardandoJogada`, `processandoTurno`, `rodadaConcluida` |
| `jogadorAtual`    | number     | Índice (0-3), 0 = humano                                                                                                   |
| `maos[0].cartas`  | Carta[]    | Suas cartas (`{valor, naipe}`)                                                                                             |
| `maos[0].visivel` | boolean    | Se suas cartas estão visíveis                                                                                              |
| `mesa`            | MesaItem[] | Cartas jogadas no turno atual                                                                                              |
| `manilha`         | Valor      | Valor da manilha desta rodada                                                                                              |
| `cartaVirada`     | Carta      | Carta que definiu a manilha                                                                                                |
| `declaracoes`     | Record     | Declarações feitas por cada jogador                                                                                        |
| `vazas`           | Record     | Turnos ganhos por cada jogador                                                                                             |
| `turno`           | number     | Turno atual (1 a N)                                                                                                        |
| `cartasPorRodada` | number     | Cartas distribuídas por jogador                                                                                            |

### 6.3. Ações Disponíveis via `eval`

| Ação                         | Código                                                                                                                                                                |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Pular menu**               | `window.__jogoPhaser.scene.getScene('MenuScene').scene.start('JogoScene')`                                                                                            |
| **Declarar**                 | `window.__jogoPhaser.scene.getScene('JogoScene').decisorDeclaracaoHumano.confirmar(<n>)`                                                                              |
| **Selecionar + jogar carta** | `window.__jogoPhaser.scene.getScene('JogoScene').decisorHumano.selecionar({valor, naipe}); window.__jogoPhaser.scene.getScene('JogoScene').decisorHumano.confirmar()` |

---

## 7. Timing de Animações

Use `browser: wait <ms>` após ações que disparam animações:

| Evento                                | Delay       |
| ------------------------------------- | ----------- |
| Transição menu → jogo                 | 1500ms      |
| Bot declara                           | 400ms cada  |
| Bot joga                              | 500ms cada  |
| Recolhimento de turno                 | 800ms       |
| Total típico após sua jogada (3 bots) | 2000-3000ms |

---

## 8. Checklist de Rodada

- [ ] `pnpm dev` rodando
- [ ] Browser aberto na URL correta
- [ ] Pulei o menu via `eval`
- [ ] Li estado inicial (manilha, minhas cartas, cartasPorRodada)
- [ ] Declar quando for minha vez (`decisorDeclaracaoHumano.confirmar`)
- [ ] Aguardei bots declararem
- [ ] Loop: li estado → joguei carta → aguardei (até `rodadaConcluida`)
- [ ] Screenshot final com overlay "Rodada concluída"
