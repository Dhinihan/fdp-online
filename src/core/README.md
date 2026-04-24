# src/core/

Regras puras do jogo FDP (Faz De Propósito).

Esta camada contém todo o código TypeScript puro — sem dependência de frameworks de renderização como Phaser. Aqui ficam as entidades, casos de uso, máquina de estados e eventos do jogo.

O adapter (Phaser) consome o estado público emitido pelo core, mas nunca decide regras.
