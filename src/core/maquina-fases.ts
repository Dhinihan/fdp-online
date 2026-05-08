import type { FaseRodada } from '@/types/estado-rodada';

const TRANSICOES_VALIDAS: Record<FaseRodada, FaseRodada[]> = {
  distribuindo: ['aguardandoDeclaracao'],
  aguardandoDeclaracao: ['processandoDeclaracao'],
  processandoDeclaracao: ['aguardandoDeclaracao', 'aguardandoJogada'],
  aguardandoJogada: ['processandoTurno'],
  processandoTurno: ['aguardandoJogada', 'rodadaConcluida'],
  rodadaConcluida: [],
  turnoConcluido: [],
};

export function validarTransicaoFase(faseAtual: FaseRodada, novaFase: FaseRodada): void {
  const validas = TRANSICOES_VALIDAS[faseAtual];
  if (!validas.includes(novaFase)) {
    throw new Error(`Transição inválida: ${faseAtual} → ${novaFase}`);
  }
}
