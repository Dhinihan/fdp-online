import type { EstadoRodada } from './estado-rodada';

type CamposPartida = {
  numeroRodada: number;
  jogadoresAtivos: string[];
  embaralhadorId: string;
  jogoEncerrado: boolean;
};

export type EstadoPartida = EstadoRodada & CamposPartida;
