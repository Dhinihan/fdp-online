import type { Carta } from '@/core/Carta';
import { calcularIndiceVencedor } from '@/core/comparador-carta';
import { estadoEmJogo, type EstadoEmJogo, type EstadoRodada } from '@/types/estado-rodada';
import {
  calcularJogadoresPorAgir,
  calcularNecessidade,
  jogadoresInteressadosPorAgir,
  urgenciaAlta,
} from './contexto-posicao-mesa';

export type PosicaoMesaJogadaDebug = 'abre' | 'meio' | 'fecha';
export type LinhaDecisaoJogadaDebug = 'fria' | 'quente';

export interface ContextoJogadaDebug {
  posicaoMesa: PosicaoMesaJogadaDebug;
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
    urgenciaAlta: urgenciaAlta(necessidade, tamanhoMao),
    jogadoresPorAgir,
    liderId,
    liderNecessidade: liderId ? calcularNecessidade(atual, liderId) : null,
    jogadoresInteressadosPorAgir: jogadoresInteressadosPorAgir(atual).length,
  };
}

export function criarLinhaJogadaDebug(carta: Carta, motivo: string | undefined, caminho: string[]): LinhaJogadaDebug {
  return {
    carta,
    motivo: motivo ?? 'motivo não registrado',
    caminho,
  };
}

export function criarCaminhoJogadaDebug(
  posicao: PosicaoMesaJogadaDebug,
  linha: LinhaDecisaoJogadaDebug,
  etapa?: string,
): string[] {
  const caminho = ['jogada', rotuloPosicao(posicao), `linha ${linha}`];
  return etapa ? [...caminho, etapa] : caminho;
}

function definirPosicaoMesa(estado: EstadoEmJogo, jogadoresPorAgir: number): PosicaoMesaJogadaDebug {
  if (estado.mesa.length === 0) return 'abre';
  if (jogadoresPorAgir === 0) return 'fecha';
  return 'meio';
}

function rotuloPosicao(posicao: PosicaoMesaJogadaDebug): string {
  if (posicao === 'abre') return 'abre a mesa';
  if (posicao === 'fecha') return 'fecha a mesa';
  return 'joga no meio';
}

function obterLiderId(estado: EstadoEmJogo): string | null {
  if (estado.mesa.length === 0) return null;
  return estado.mesa[calcularIndiceVencedor(estado.mesa, estado.manilha)].jogadorId;
}
