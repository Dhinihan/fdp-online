import type { Carta } from '@/core/Carta';
import { compararValor, compararNaipe } from '@/core/Carta';
import type { DecisorJogada } from '@/core/portas/DecisorJogada';

function ehMenor(a: Carta, b: Carta): boolean {
  if (a.valor !== b.valor) {
    return !compararValor(a, b) && !compararValor(b, a) ? compararNaipe(b, a) : !compararValor(a, b);
  }
  return !compararNaipe(a, b);
}

export class BotDeterministico implements DecisorJogada {
  decidirJogada(mao: Carta[], _estado: unknown): Promise<Carta> {
    if (mao.length === 0) {
      return Promise.reject(new Error('Mão vazia'));
    }
    let menor = mao[0];
    for (let i = 1; i < mao.length; i++) {
      if (ehMenor(mao[i], menor)) {
        menor = mao[i];
      }
    }
    return Promise.resolve(menor);
  }
}
