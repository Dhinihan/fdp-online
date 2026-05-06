import type { Carta } from '@/core/Carta';
import type { EstadoRodada } from '@/types/estado-rodada';

export interface DecisorDeclaracao {
  declarar(estado: EstadoRodada, mao: Carta[]): Promise<number>;
}
