# Abandono não zera a Sequência de Vitórias

A Sequência de Vitórias do jogador humano é atualizada exclusivamente no encerramento de uma Partida concluída (`JOGO_ENCERRADO`), o mesmo gatilho que alimenta o Ranking: vencer incrementa, qualquer outra Classificação da Partida zera. Abandonar uma Partida no meio — fechar a aba ou voltar ao menu sem concluí-la — não conta como derrota nem zera a sequência, espelhando a regra do Ranking de só registrar Partidas concluídas.

## Considered Options

Avaliamos tratar o abandono como derrota (zerar a sequência ao detectar saída no meio da Partida). Isso exigiria observar a saída do navegador/cena e introduziria um segundo ponto de escrita, além de criar a categoria ambígua de "Partida abandonada" que hoje não existe em nenhum lugar do domínio.

## Consequences

Permite "save-scumming": o jogador que percebe a derrota iminente pode fechar a aba para preservar a sequência. Aceitamos isso conscientemente — o FDP é um jogo casual e a Sequência de Vitórias é uma recompensa de engajamento, não um placar competitivo a ser defendido contra trapaça. Em troca, a escrita fica num único ponto, coerente com o Ranking, sem detecção de saída.
