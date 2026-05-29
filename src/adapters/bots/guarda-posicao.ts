import type { LeituraDaMesa } from './ler-mesa';

export interface GuardaPosicao {
  permite: boolean;
  motivo: string;
}

export function avaliarGuardaDePosicao(leitura: LeituraDaMesa): GuardaPosicao {
  if (leitura.urgenciaAlta) return { permite: true, motivo: 'urgência alta' };

  if (leitura.jogadoresPorAgir === 1 && leitura.interessadosPorAgir.length > 0 && temGarantidaAgora(leitura)) {
    return { permite: true, motivo: 'vencedora garantida agora' };
  }
  if (leitura.interessadosPorAgir.length === 0) {
    return { permite: true, motivo: 'jogadores por agir já cumpriram' };
  }
  return { permite: false, motivo: 'jogador por agir ainda precisa' };
}

function temGarantidaAgora(leitura: LeituraDaMesa): boolean {
  return leitura.vencedoras.some((avaliada) => avaliada.categoria === 'garantida_agora');
}
