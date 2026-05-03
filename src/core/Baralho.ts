import type { Carta, Naipe, Valor } from './Carta';

const valores: Valor[] = ['3', '2', 'A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4'];
const naipes: Naipe[] = ['♣', '♥', '♠', '♦'];

export function criarBaralho(): Carta[] {
  const baralho: Carta[] = [];
  for (const naipe of naipes) {
    for (const valor of valores) {
      baralho.push({ valor, naipe });
    }
  }
  return baralho;
}

export function distribuir(cartas: Carta[], numeroCartas: number, numeroJogadores: number): Carta[][] {
  if (numeroCartas * numeroJogadores > cartas.length) {
    throw new Error(
      `Não há cartas suficientes para distribuir ${numeroCartas.toString()} cartas para ${numeroJogadores.toString()} jogadores. Cartas disponíveis: ${cartas.length.toString()}.`,
    );
  }
  const maos: Carta[][] = Array.from({ length: numeroJogadores }, () => []);
  for (let i = 0; i < numeroCartas; i++) {
    for (let j = 0; j < numeroJogadores; j++) {
      maos[j].push(cartas[i * numeroJogadores + j]);
    }
  }
  return maos;
}
