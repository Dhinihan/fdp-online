import { calcularIndiceVencedor } from '@/core/comparador-carta';
import type { EstadoEmJogo } from '@/types/estado-rodada';

export const LIMIAR_URGENCIA_ALTA = 0.66;

export function calcularNecessidade(estado: EstadoEmJogo, jogadorId: string): number {
  return (estado.declaracoes[jogadorId] ?? 0) - (estado.vazas[jogadorId] ?? 0);
}

export function calcularJogadoresPorAgir(estado: EstadoEmJogo): number {
  return Math.max(0, estado.maos.length - estado.mesa.length - 1);
}

export function jogadoresPorAgirDepois(estado: EstadoEmJogo): string[] {
  return Array.from({ length: calcularJogadoresPorAgir(estado) }).map((_, indice) => {
    const proximoIndice = (estado.jogadorAtual + indice + 1) % estado.maos.length;
    return estado.maos[proximoIndice].jogador.id;
  });
}

export function jogadoresInteressadosPorAgir(estado: EstadoEmJogo): string[] {
  return jogadoresPorAgirDepois(estado).filter((jogadorId) => calcularNecessidade(estado, jogadorId) > 0);
}

export function urgenciaAlta(necessidade: number, tamanhoMao: number): boolean {
  return tamanhoMao > 0 && necessidade / tamanhoMao >= LIMIAR_URGENCIA_ALTA;
}

export function ehUltimoDaMesa(estado: EstadoEmJogo): boolean {
  return estado.mesa.length === estado.maos.length - 1;
}

export function liderQuerVaza(estado: EstadoEmJogo): boolean {
  if (estado.mesa.length === 0) return false;
  const lider = estado.mesa[calcularIndiceVencedor(estado.mesa, estado.manilha)];
  return calcularNecessidade(estado, lider.jogadorId) > 0;
}
