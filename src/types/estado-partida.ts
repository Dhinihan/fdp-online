import type { EstadoRodada } from './estado-rodada';

export interface EstadoPartida extends EstadoRodada {
  numeroRodada: number;
  jogadoresAtivos: string[];
  embaralhadorId: string;
  jogoEncerrado: boolean;
}
