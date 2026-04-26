export type Naipe = 'copas' | 'espadas' | 'ouros' | 'paus';

export type Valor = '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A' | '2' | '3';

export interface Carta {
  naipe: Naipe;
  valor: Valor;
  virada: boolean;
}

export interface Jogador {
  id: string;
  nome: string;
  pontos: number;
  avatar?: string;
}
