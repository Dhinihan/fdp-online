export type Valor = '3' | '2' | 'A' | 'K' | 'Q' | 'J' | '10' | '9' | '8' | '7' | '6' | '5' | '4';

export type Naipe = '♣' | '♥' | '♠' | '♦';

export interface Carta {
  valor: Valor;
  naipe: Naipe;
}

const valoresOrdem: Valor[] = ['3', '2', 'A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4'];

const hierarquiaValores: Record<Valor, number> = {
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

const hierarquiaNaipes: Record<Naipe, number> = {
  '♣': 4,
  '♥': 3,
  '♠': 2,
  '♦': 1,
};

export function compararValor(a: Carta, b: Carta): boolean {
  return hierarquiaValores[a.valor] > hierarquiaValores[b.valor];
}

export function compararNaipe(a: Carta, b: Carta): boolean {
  return hierarquiaNaipes[a.naipe] > hierarquiaNaipes[b.naipe];
}

export function obterProximoValor(valor: Valor): Valor {
  const indice = valoresOrdem.indexOf(valor);
  const proximoIndice = (indice - 1 + valoresOrdem.length) % valoresOrdem.length;
  return valoresOrdem[proximoIndice];
}

export function ehManilha(carta: Carta, manilha: Valor): boolean {
  return carta.valor === manilha;
}
