import type { Carta } from '@/core/Carta';
import type { EstadoRodada } from '@/types/estado-rodada';

export interface DecisorJogada {
  decidirJogada(mao: Carta[], estado: EstadoRodada): Promise<Carta>;
}
