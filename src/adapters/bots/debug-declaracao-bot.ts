import type { CartaAvaliada } from '@/core/avaliador-carta';

export interface DecisaoDeclaracaoDebug {
  mao: CartaAvaliada[];
  baseDeterministica: number;
  fortesVisiveis: CartaAvaliada[];
  altasCandidatas: CartaAvaliada[];
  sorteiosAplicaveis: CartaAvaliada[];
  sorteiosNaoAplicaveis: CartaAvaliada[];
  defensivo: DefensivoDebug;
  resultadoFinal: number;
  regraEspecialPrimeiraRodada: boolean;
}

export type DefensivoDebug =
  | { estado: 'não elegível' }
  | { estado: 'sorteou'; aplicaria: boolean }
  | { estado: 'bloqueado'; base: number; teto: number; resultado: number; cartasPorRodada: number }
  | { estado: 'aplicado' };
