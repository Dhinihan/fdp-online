import type { EstadoEmJogo } from '@/types/estado-rodada';
import { calcularJogadoresPorAgir, jogadoresInteressadosPorAgir, urgenciaAlta } from './contexto-posicao-mesa';

export interface ContextoGuardaPosicao {
  estado: EstadoEmJogo;
  necessidade: number;
  tamanhoMao: number;
  temGarantidaAgora: boolean;
}

export interface GuardaPosicao {
  permite: boolean;
  motivo: string;
}

export function avaliarGuardaDePosicao(contexto: ContextoGuardaPosicao): GuardaPosicao {
  const { estado, necessidade, tamanhoMao, temGarantidaAgora } = contexto;
  const jogadoresPorAgir = calcularJogadoresPorAgir(estado);
  if (urgenciaAlta(necessidade, tamanhoMao)) return { permite: true, motivo: 'urgência alta' };

  const interessados = jogadoresInteressadosPorAgir(estado);
  if (jogadoresPorAgir === 1 && interessados.length > 0 && temGarantidaAgora) {
    return { permite: true, motivo: 'vencedora garantida agora' };
  }
  if (interessados.length === 0) return { permite: true, motivo: 'jogadores por agir já cumpriram' };
  return { permite: false, motivo: 'jogador por agir ainda precisa' };
}
