import type { CartaAvaliada } from '@/core/avaliador-carta';
import type { Carta } from '@/core/Carta';
import { compararForcaReal } from '@/core/comparador-carta';

export function escolherVencedoraPorNecessidade(
  avaliadas: CartaAvaliada[],
  manilha: Carta['valor'],
  necessidade: number,
): CartaAvaliada {
  const ordenadas = ordenarPorForcaReal(avaliadas, manilha);
  const indice = ordenadas.length >= necessidade ? ordenadas.length - necessidade : 0;
  return ordenadas[indice];
}

export function descartePorNecessidade(
  avaliadas: CartaAvaliada[],
  manilha: Carta['valor'],
  necessidade: number,
): CartaAvaliada {
  const ordenadas = ordenarPorForcaReal(avaliadas, manilha);
  const indice = ordenadas.length > necessidade ? ordenadas.length - necessidade : 0;
  return ordenadas[indice];
}

export function ordenarPorForcaReal(avaliadas: CartaAvaliada[], manilha: Carta['valor']): CartaAvaliada[] {
  return [...avaliadas].sort((a, b) => compararForcaReal(a.carta, b.carta, manilha));
}

export function cartaMaisForte(avaliadas: CartaAvaliada[], manilha: Carta['valor']): CartaAvaliada {
  const ordenadas = ordenarPorForcaReal(avaliadas, manilha);
  return ordenadas[ordenadas.length - 1];
}
