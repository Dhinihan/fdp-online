export interface GeradorAleatorio {
  random(): number;
  randomInt(min: number, max: number): number;
  shuffle<T>(array: T[]): T[];
}

export class RngComSeed implements GeradorAleatorio {
  private estado: number;

  constructor(seed: number) {
    this.estado = seed >>> 0;
  }

  random(): number {
    this.estado += 0x6d2b79f5;
    let valor = this.estado;
    valor = Math.imul(valor ^ (valor >>> 15), valor | 1);
    valor ^= valor + Math.imul(valor ^ (valor >>> 7), valor | 61);
    return ((valor ^ (valor >>> 14)) >>> 0) / 4294967296;
  }

  randomInt(min: number, max: number): number {
    if (!Number.isInteger(min) || !Number.isInteger(max) || min > max) {
      throw new Error(`Intervalo inválido para randomInt: ${min.toString()}..${max.toString()}`);
    }
    return Math.floor(this.random() * (max - min + 1)) + min;
  }

  shuffle<T>(array: T[]): T[] {
    const copia = [...array];
    for (let i = copia.length - 1; i > 0; i--) {
      const j = this.randomInt(0, i);
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
  }
}
