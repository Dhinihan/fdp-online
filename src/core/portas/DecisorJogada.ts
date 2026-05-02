import type { Carta } from '@/core/Carta';

export interface DecisorJogada {
  decidirJogada(mao: Carta[], estado: unknown): Promise<Carta>;
}
