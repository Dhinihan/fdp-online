import type { CartaAvaliada } from '@/core/avaliador-carta';
import type { EstadoEmJogo } from '@/types/estado-rodada';

export interface ContextoGuardaPosicao {
  estado: EstadoEmJogo;
  necessidade: number;
  tamanhoMao: number;
  vencedoras: CartaAvaliada[];
}

export interface GuardaPosicao {
  permite: boolean;
  motivo: string;
}

export function avaliarGuardaDePosicao(contexto: ContextoGuardaPosicao): GuardaPosicao {
  const { estado, necessidade, tamanhoMao, vencedoras } = contexto;
  const jogadoresPorAgir = calcularJogadoresPorAgir(estado);
  if (jogadoresPorAgir <= 0) return { permite: true, motivo: 'fecha a mesa' };
  if (necessidade / tamanhoMao >= 0.66) return { permite: true, motivo: 'urgência alta' };

  const interessados = jogadoresPorAgirDepois(estado).filter((jogadorId) => calcularNecessidade(estado, jogadorId) > 0);
  if (jogadoresPorAgir === 1 && interessados.length > 0 && temVencedoraGarantida(vencedoras)) {
    return { permite: true, motivo: 'vencedora garantida agora' };
  }
  if (interessados.length === 0) return { permite: true, motivo: 'jogadores por agir já cumpriram' };
  return { permite: false, motivo: 'jogador por agir ainda precisa' };
}

function calcularNecessidade(estado: EstadoEmJogo, jogadorId: string): number {
  return (estado.declaracoes[jogadorId] ?? 0) - (estado.vazas[jogadorId] ?? 0);
}

function calcularJogadoresPorAgir(estado: EstadoEmJogo): number {
  return Math.max(0, estado.maos.length - estado.mesa.length - 1);
}

function jogadoresPorAgirDepois(estado: EstadoEmJogo): string[] {
  return Array.from({ length: calcularJogadoresPorAgir(estado) }).map((_, indice) => {
    const proximoIndice = (estado.jogadorAtual + indice + 1) % estado.maos.length;
    return estado.maos[proximoIndice].jogador.id;
  });
}

function temVencedoraGarantida(vencedoras: CartaAvaliada[]): boolean {
  return vencedoras.some((avaliada) => avaliada.categoria === 'garantida_agora');
}
