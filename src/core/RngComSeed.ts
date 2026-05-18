import { unsafeUniformIntDistribution, xoroshiro128plus, type RandomGenerator } from 'pure-rand';

export interface GeradorAleatorio {
  random(): number;
  randomInt(min: number, max: number): number;
  shuffle<T>(array: T[]): T[];
}

export class RngComSeed implements GeradorAleatorio {
  private engine: RandomGenerator;

  constructor(seed: number) {
    this.engine = xoroshiro128plus(seed);
  }

  random(): number {
    return (this.engine.unsafeNext() >>> 0) / 4294967296;
  }

  randomInt(min: number, max: number): number {
    if (!Number.isInteger(min) || !Number.isInteger(max) || min > max) {
      throw new Error(`Intervalo inválido para randomInt: ${min.toString()}..${max.toString()}`);
    }
    return unsafeUniformIntDistribution(min, max, this.engine);
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
