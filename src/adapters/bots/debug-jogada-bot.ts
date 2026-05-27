import type { Carta } from '@/core/Carta';
import { calcularIndiceVencedor } from '@/core/comparador-carta';
import { estadoEmJogo, type EstadoEmJogo, type EstadoRodada } from '@/types/estado-rodada';
import { calcularNecessidade } from './contextoLinhaQuente';

export interface ContextoJogadaDebug {
  posicaoMesa: 'abre' | 'meio' | 'fecha';
  necessidade: number;
  urgencia: number;
  urgenciaAlta: boolean;
  jogadoresPorAgir: number;
  liderId: string | null;
  liderNecessidade: number | null;
  jogadoresInteressadosPorAgir: number;
}

export interface LinhaJogadaDebug {
  carta: Carta;
  motivo: string;
  caminho: string[];
}

export function criarContextoJogadaDebug(estado: EstadoRodada, tamanhoMao: number): ContextoJogadaDebug {
  const atual = estadoEmJogo(estado);
  const jogadorId = atual.maos[atual.jogadorAtual].jogador.id;
  const necessidade = calcularNecessidade(atual, jogadorId);
  const jogadoresPorAgir = calcularJogadoresPorAgir(atual);
  const liderId = obterLiderId(atual);
  return {
    posicaoMesa: definirPosicaoMesa(atual, jogadoresPorAgir),
    necessidade,
    urgencia: tamanhoMao === 0 ? 0 : necessidade / tamanhoMao,
    urgenciaAlta: tamanhoMao > 0 && necessidade / tamanhoMao >= 0.66,
    jogadoresPorAgir,
    liderId,
    liderNecessidade: liderId ? calcularNecessidade(atual, liderId) : null,
    jogadoresInteressadosPorAgir: contarInteressadosPorAgir(atual),
  };
}

export function criarLinhaJogadaDebug(carta: Carta, motivo: string | undefined, caminho: string[]): LinhaJogadaDebug {
  return {
    carta,
    motivo: motivo ?? 'motivo não registrado',
    caminho,
  };
}

function definirPosicaoMesa(estado: EstadoEmJogo, jogadoresPorAgir: number): ContextoJogadaDebug['posicaoMesa'] {
  if (estado.mesa.length === 0) return 'abre';
  if (jogadoresPorAgir === 0) return 'fecha';
  return 'meio';
}

function calcularJogadoresPorAgir(estado: EstadoEmJogo): number {
  return Math.max(0, estado.maos.length - estado.mesa.length - 1);
}

function obterLiderId(estado: EstadoEmJogo): string | null {
  if (estado.mesa.length === 0) return null;
  return estado.mesa[calcularIndiceVencedor(estado.mesa, estado.manilha)].jogadorId;
}

function contarInteressadosPorAgir(estado: EstadoEmJogo): number {
  const jogadoresPorAgir = calcularJogadoresPorAgir(estado);
  return Array.from({ length: jogadoresPorAgir }).filter((_, indice) => {
    const jogador = estado.maos[(estado.jogadorAtual + indice + 1) % estado.maos.length].jogador;
    return calcularNecessidade(estado, jogador.id) > 0;
  }).length;
}
