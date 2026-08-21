# Matriz manual de validação offline (OFF-00..OFF-08)

Checklist executável por uma pessoa antes de promover `preview` → `main`.
Contrato de validação: [#282](https://github.com/Dhinihan/fdp-online/issues/282).
Especificação implementada: [#283](https://github.com/Dhinihan/fdp-online/issues/283).

O que a automação cobre é só a guarda de precache no CI (`pnpm verifica:precache:builds`):
ela prova que todo arquivo do `dist/` está na lista de precache do Service Worker.
Que o jogo **abre e joga** sem rede é o que esta matriz comprova, e é manual por
decisão de #283 — não há Playwright neste fluxo.

## Antes de começar

Registre o cabeçalho da execução:

| Campo                          | Valor |
| ------------------------------ | ----- |
| Data                           |       |
| Build/commit                   |       |
| URL testada                    |       |
| `assets/index-<hash>.js` da V1 |       |
| `assets/index-<hash>.js` da V2 |       |
| Executor                       |       |

Regras que invalidam a execução se quebradas:

- **HTTPS e mesma origem em todos os passos.** `/` (Vercel), `/fdp-online/` (GitHub Pages),
  cada deploy preview e `localhost` são origens distintas: preparar uma não prepara outra,
  e cada uma tem seu próprio `localStorage`.
- **Aba normal**, nunca janela privada. Sem limpar dados do site no meio da matriz.
- Perfil sem Ranking/Troféus antes de OFF-00.
- Offline de verdade (modo avião / Wi‑Fi desligado) nos dispositivos; DevTools "Offline"
  só vale como pré-checagem no desktop.

O identificador de versão é o hash de `assets/index-<hash>.js`, lido no `<head>` do
documento ou nas chaves do cache de precache (`caches.keys()` → conteúdo do cache do
Workbox). Não existe marcador de build próprio.

## Casos

| ID     | Passos                                                                                                | PASS quando                                                                                                                                                         |
| ------ | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OFF-00 | Perfil novo, online, abrir a URL e aguardar a tela inicial.                                           | A tela inicial abre, o clique de menu toca o som (`sfx/ui-click.mp3`) e o console não tem erro inesperado.                                                          |
| OFF-01 | Ainda online, aguardar `navigator.serviceWorker.ready` e conferir o precache; fechar o navegador.     | Existe registro ativo e o cache de precache contém documento, JS, CSS, `favicon.svg`, `icons.svg` e `sfx/ui-click.mp3`.                                             |
| OFF-02 | Com o navegador fechado, desligar a rede. Reabrir e navegar para a mesma URL.                         | A tela inicial abre sem erro de rede. Um reload inicia uma Partida nova — não se retoma Partida fechada.                                                            |
| OFF-03 | Iniciar uma Partida online e cortar a rede no meio de um turno. Jogar até a tela de fim.              | A Partida não reinicia, não congela e não é substituída por atualização. Todas as rodadas completam e o resultado aparece.                                          |
| OFF-04 | Concluir uma Partida offline e abrir Ranking e Troféus. Anotar os valores.                            | O resultado novo está no Ranking e os Troféus esperados aparecem (`fdp.ranking.v1` e `fdp.trofeus.v1` no `localStorage` da mesma origem).                           |
| OFF-05 | Ainda offline, fechar e reabrir o navegador no mesmo perfil.                                          | Ranking e Troféus idênticos aos de OFF-04; a tela inicial abre e dá para começar uma Partida nova.                                                                  |
| OFF-06 | Voltar à rede, publicar/apontar para a V2, abrir a aplicação, jogar um pouco, fechar e abrir de novo. | Nenhum prompt e nenhuma recarga forçada. O hash da V2 só passa a servir numa abertura posterior. Ranking e Troféus da V1 intactos.                                  |
| OFF-07 | Desligar a rede de novo e abrir a URL.                                                                | A V2 abre offline e é jogável; Ranking e Troféus da V1 continuam lá.                                                                                                |
| OFF-08 | Inspecionar o `<head>` do documento.                                                                  | Não há `link rel="manifest"` — `manifest: false` é decisão de #283, instalação está fora de escopo. Abrir pelo navegador normal continua sendo o caminho suportado. |

Um caso é PASS só quando todos os asserts da linha passam no alvo em teste.

## Células por alvo

Preencher `PASS` / `FAIL` / `N/A`, e a versão exata do navegador em cada coluna.
Um PASS em viewport emulado **não** vale como PASS de celular; um PASS no WebKit do
Playwright **não** vale como PASS de Safari.

### `/` (Vercel)

| Alvo              | Versão | OFF-00 | OFF-01 | OFF-02 | OFF-03 | OFF-04 | OFF-05 | OFF-06 | OFF-07 | OFF-08 |
| ----------------- | ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| Chrome desktop    |        |        |        |        |        |        |        |        |        |        |
| Chrome Android    |        |        |        |        |        |        |        |        |        |        |
| Edge desktop      |        |        |        |        |        |        |        |        |        |        |
| Edge Android      |        |        |        |        |        |        |        |        |        |        |
| Firefox desktop   |        |        |        |        |        |        |        |        |        |        |
| Firefox Android   |        |        |        |        |        |        |        |        |        |        |
| Safari macOS      |        |        |        |        |        |        |        |        |        |        |
| Safari iOS/iPadOS |        |        |        |        |        |        |        |        |        |        |

### `/fdp-online/` (GitHub Pages)

| Alvo              | Versão | OFF-00 | OFF-01 | OFF-02 | OFF-03 | OFF-04 | OFF-05 | OFF-06 | OFF-07 | OFF-08 |
| ----------------- | ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| Chrome desktop    |        |        |        |        |        |        |        |        |        |        |
| Chrome Android    |        |        |        |        |        |        |        |        |        |        |
| Edge desktop      |        |        |        |        |        |        |        |        |        |        |
| Edge Android      |        |        |        |        |        |        |        |        |        |        |
| Firefox desktop   |        |        |        |        |        |        |        |        |        |        |
| Firefox Android   |        |        |        |        |        |        |        |        |        |        |
| Safari macOS      |        |        |        |        |        |        |        |        |        |        |
| Safari iOS/iPadOS |        |        |        |        |        |        |        |        |        |        |

## Evidência

Guardar screenshot ou vídeo curto de OFF-00, OFF-02, OFF-03, OFF-05 e OFF-07,
mais o passo exato em que a rede caiu no OFF-03.

## Limites conhecidos

- **ITP do Safari** apaga registro do SW, precache e `localStorage` após 7 dias sem
  interação com o site. O precache se cura na primeira abertura online; Ranking e
  Troféus não. Fora do escopo, rastreado em [#285](https://github.com/Dhinihan/fdp-online/issues/285).
- **GitHub Pages serve com `max-age=600`**: a checagem de atualização do `sw.js` pode
  reaproveitar bytes por até 10 minutos. Não afeta o contrato — a V2 entra numa
  abertura posterior de qualquer forma.
