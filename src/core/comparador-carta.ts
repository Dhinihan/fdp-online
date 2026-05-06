import { compararNaipe, compararValor, ehManilha } from './Carta';
import type { Carta } from './Carta';

export function cartaVence(carta: Carta, outra: Carta, manilha: Carta['valor']): boolean {
  const cartaEhManilha = ehManilha(carta, manilha);
  const outraEhManilha = ehManilha(outra, manilha);

  if (cartaEhManilha && !outraEhManilha) return true;
  if (!cartaEhManilha && outraEhManilha) return false;
  if (cartaEhManilha && outraEhManilha) return compararNaipe(carta, outra);

  if (compararValor(carta, outra)) return true;
  if (compararValor(outra, carta)) return false;
  return compararNaipe(carta, outra);
}

export function calcularIndiceVencedor(mesa: { carta: Carta }[], manilha: Carta['valor']): number {
  let indiceMelhor = 0;
  for (let i = 1; i < mesa.length; i++) {
    const cartaAtual = mesa[i].carta;
    const cartaMelhor = mesa[indiceMelhor].carta;
    if (cartaVence(cartaAtual, cartaMelhor, manilha)) {
      indiceMelhor = i;
    }
  }
  return indiceMelhor;
}

export function cartasEmpatam(carta: Carta, outra: Carta, manilha: Carta['valor']): boolean {
  const cartaEhManilha = ehManilha(carta, manilha);
  const outraEhManilha = ehManilha(outra, manilha);
  if (cartaEhManilha !== outraEhManilha) return false;
  if (cartaEhManilha && outraEhManilha) return false;
  return carta.valor === outra.valor;
}
