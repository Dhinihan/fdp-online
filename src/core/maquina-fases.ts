import type { FaseRodada } from '@/types/estado-rodada';

const TRANSICOES_VALIDAS: Record<FaseRodada, FaseRodada[]> = {
  distribuindo: ['aguardandoDeclaracao'],
  aguardandoDeclaracao: ['processandoDeclaracao'],
  processandoDeclaracao: ['aguardandoDeclaracao', 'aguardandoJogada'],
  aguardandoJogada: ['processandoTurno'],
  processandoTurno: ['aguardandoJogada', 'rodadaConcluida'],
  rodadaConcluida: [],
};

export class MaquinaFases {
  private fase: FaseRodada;

  constructor(faseInicial: FaseRodada = 'distribuindo') {
    this.fase = faseInicial;
  }

  get atual(): FaseRodada {
    return this.fase;
  }

  eh(fase: FaseRodada): boolean {
    return this.fase === fase;
  }

  transitar(novaFase: FaseRodada): void {
    const validas = TRANSICOES_VALIDAS[this.fase];
    if (!validas.includes(novaFase)) {
      throw new Error(`Transição inválida: ${this.fase} → ${novaFase}`);
    }
    this.fase = novaFase;
  }

  /** Define a fase sem validação. Uso interno para restauração de estado. */
  definir(fase: FaseRodada): void {
    this.fase = fase;
  }
}
