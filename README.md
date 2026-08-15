# FDP — Faz De Propósito

Jogo de cartas brasileiro online. Gratuito, open-source, multiplayer P2P via browser.

---

## Sobre o jogo

- **Baralho:** padrão de 52 cartas (não é o Buró).
- **Jogadores:** 2+ casual / 4 ranqueado.
- **Objetivo:** ser o último com pontos positivos.

## Regras decididas

- **Pontos:** 5 iniciais. Só diminuem. Negativos permitidos em empates.
- **Fim:** quando resta apenas um jogador com pontos > 0.
- **Ordem:** anti-horária.
- **Distribuição:** na rodada N, cada jogador recebe N cartas (máximo 13). Se alguém for eliminado, a contagem volta para 1.
- **Quem joga:** o vencedor da rodada abre a próxima. Sem obrigação de seguir naipe.
- **Manilha:** vira-se uma carta; o próximo valor na hierarquia vence. Hierarquia: **3 > 2 > A > K > Q > J > 7 > 6 > 5 > 4**. Se não houver carta para virar, manilha é o 3.
- **Primeira rodada especial:** você não vê a própria carta, mas vê as dos outros jogadores.
- **Penalidade:** |turnos declarados − turnos ganhos| é subtraído dos pontos.

## Tecnologia

- Browser game (mobile-first).
- Multiplayer P2P via WebRTC.
- Deploy no Vercel (produção) e no GitHub Pages (playtest).

## Onde jogar

| Link                                   | Branch    | Para quê                                     |
| -------------------------------------- | --------- | -------------------------------------------- |
| https://fdp-online.vercel.app          | `main`    | Produção.                                    |
| https://dhinihan.github.io/fdp-online/ | `preview` | Playtest: balanceamento, diversão, feedback. |

Os dois guardam ranking e troféus separados, porque `localStorage` é por origem.
Acrescente `?debug=1` a qualquer um dos links para ligar o modo de depuração.

### Fluxo de branches

PRs têm `preview` como base, e cada merge nela republica o link de playtest.
Promover `preview` → `main` (isto é, para produção) é decisão explícita, nunca
parte de entregar uma feature.

## Regras completas

Abra `index.html` no navegador ou acesse a versão hospedada.
