import { compararNaipe, compararValor, ehManilha, type Carta, type Naipe, type Valor } from './Carta';

const forcaValores: Record<Valor, number> = {
  '3': 13,
  '2': 12,
  A: 11,
  K: 10,
  Q: 9,
  J: 8,
  '10': 7,
  '9': 6,
  '8': 5,
  '7': 4,
  '6': 3,
  '5': 2,
  '4': 1,
};

const forcaNaipes: Record<Naipe, number> = {
  '♣': 4,
  '♥': 3,
  '♠': 2,
  '♦': 1,
};

export function cartaVence(carta: Carta, outra: Carta, manilha: Carta['valor']): boolean {
  const cartaEhManilha = ehManilha(carta, manilha);
  const outraEhManilha = ehManilha(outra, manilha);

  if (cartaEhManilha && !outraEhManilha) return true;
  if (!cartaEhManilha && outraEhManilha) return false;
  if (cartaEhManilha && outraEhManilha) return compararNaipe(carta, outra);

  if (compararValor(carta, outra)) return true;
  if (compararValor(outra, carta)) return false;
  return false;
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

export function compararForcaReal(a: Carta, b: Carta, manilha: Carta['valor']): number {
  const aEhManilha = ehManilha(a, manilha);
  const bEhManilha = ehManilha(b, manilha);
  if (aEhManilha !== bEhManilha) return aEhManilha ? 1 : -1;
  if (aEhManilha && bEhManilha) return forcaNaipes[a.naipe] - forcaNaipes[b.naipe];

  const diferencaValor = forcaValores[a.valor] - forcaValores[b.valor];
  if (diferencaValor !== 0) return diferencaValor;
  return forcaNaipes[a.naipe] - forcaNaipes[b.naipe];
}
