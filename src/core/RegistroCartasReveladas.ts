import type { Carta } from './Carta';
import { cartaVence } from './comparador-carta';

export class RegistroCartasReveladas {
  private cartas: Carta[] = [];

  registrar(carta: Carta): void {
    if (this.foiRevelada(carta)) return;
    this.cartas = [...this.cartas, { ...carta }];
  }

  cartasReveladas(): Carta[] {
    return this.cartas.map((carta) => ({ ...carta }));
  }

  foiRevelada(carta: Carta): boolean {
    return this.cartas.some((revelada) => cartasIguais(revelada, carta));
  }

  cartasSuperioresReveladas(carta: Carta, manilha: Carta['valor']): Carta[] {
    return this.cartasReveladas().filter((revelada) => cartaVence(revelada, carta, manilha));
  }

  reiniciar(): void {
    this.cartas = [];
  }
}

function cartasIguais(a: Carta, b: Carta): boolean {
  return a.valor === b.valor && a.naipe === b.naipe;
}
