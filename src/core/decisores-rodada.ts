import type { DecisorDeclaracao } from './portas/DecisorDeclaracao';
import type { DecisorJogada } from './portas/DecisorJogada';
import type { GeradorAleatorio } from './RngComSeed';

export interface DecisoresRodada {
  jogada: Map<string, DecisorJogada>;
  declaracao: Map<string, DecisorDeclaracao>;
  numeroRodada?: number;
  jogadorInicialIndice?: number;
  rng?: GeradorAleatorio;
}
