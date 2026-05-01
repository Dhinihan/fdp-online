# Core desacoplado do Phaser e renderizado por eventos

No FDP, o core do jogo será TypeScript puro e não conhecerá Phaser. As regras emitem eventos imutáveis consumidos por um adapter, inicialmente em Phaser, para preservar testabilidade, manter a lógica de jogo independente da engine e permitir trocar a camada de renderização no futuro sem reescrever o domínio.
