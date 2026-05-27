import { avaliarCartas, type CartaAvaliada } from '@/core/avaliador-carta';
import type { Carta } from '@/core/Carta';
import { calcularIndiceVencedor, cartaVence } from '@/core/comparador-carta';
import type { DecisorJogada } from '@/core/portas/DecisorJogada';
import { estadoEmJogo, type EstadoEmJogo, type MesaItem, type EstadoRodada } from '@/types/estado-rodada';
import { decidirAberturaLinhaFria } from './decidirAbertura';
import {
  descartePorNecessidade,
  escolherVencedoraPorNecessidade,
  ordenarPorForcaReal,
} from './escolhas-por-necessidade';

export interface DecisaoLinhaFria {
  carta: Carta;
  motivo: string;
  caminho?: string[];
}

export class DecisorJogadaLinhaFria implements DecisorJogada {
  decidirJogada(mao: Carta[], estado: EstadoRodada): Promise<Carta> {
    if (mao.length === 0) return Promise.reject(new Error('Mão vazia'));

    const estadoAtual = estadoEmJogo(estado);
    if (ehUltimoDaMesa(estadoAtual)) return Promise.resolve(decidirUltimoLinhaFria(mao, estadoAtual).carta);
    return Promise.resolve(decidirNaoUltimoLinhaFria(mao, estadoAtual).carta);
  }
}

export function decidirNaoUltimoLinhaFria(mao: Carta[], estado: EstadoEmJogo): DecisaoLinhaFria {
  if (estado.mesa.length === 0) {
    return decidirAberturaLinhaFria(mao, estado);
  }

  const avaliadas = avaliarCartas(mao, estado.manilha, estado.cartasReveladas, estado.maos.length);
  const jogadorId = estado.maos[estado.jogadorAtual].jogador.id;
  const necessidade = calcularNecessidade(estado, jogadorId);
  if (necessidade <= 0) return fugirNaoUltimo(estado, avaliadas);
  return buscarVazaNaoUltimo(estado, avaliadas, necessidade);
}

function fugirNaoUltimo(estado: EstadoEmJogo, avaliadas: CartaAvaliada[]): DecisaoLinhaFria {
  const naoFazem = cartasQueNaoFazem(estado, avaliadas);
  if (naoFazem.length === 0) {
    return { carta: cartaMaisBarata(avaliadas).carta, motivo: 'não quer fazer; fuga impossível' };
  }
  return { carta: cartaMaisCara(naoFazem).carta, motivo: 'não quer fazer; carta mais alta que não faz' };
}

function buscarVazaNaoUltimo(estado: EstadoEmJogo, avaliadas: CartaAvaliada[], necessidade: number): DecisaoLinhaFria {
  const vencedoras = cartasQueVencem(estado, avaliadas);
  if (vencedoras.length > 0) {
    return {
      carta: escolherVencedoraPorNecessidade(vencedoras, estado.manilha, necessidade).carta,
      motivo: 'precisa fazer; regra G[N-X]',
    };
  }

  const naoFazem = cartasQueNaoFazem(estado, avaliadas);
  if (naoFazem.length > 0) {
    return {
      carta: descartePorNecessidade(naoFazem, estado.manilha, necessidade).carta,
      motivo: 'precisa fazer; regra P[N-X]',
    };
  }
  return { carta: cartaMaisBarata(avaliadas).carta, motivo: 'precisa fazer; carta mais barata' };
}

export function decidirUltimoLinhaFria(mao: Carta[], estado: EstadoEmJogo): DecisaoLinhaFria {
  const avaliadas = avaliarCartas(mao, estado.manilha, estado.cartasReveladas, estado.maos.length);
  const jogadorId = estado.maos[estado.jogadorAtual].jogador.id;
  const necessidade = calcularNecessidade(estado, jogadorId);

  if (necessidade > 0) return decidirUltimoQuandoPrecisaFazer(estado, avaliadas, necessidade);
  return decidirUltimoQuandoJaCumpriu(estado, avaliadas);
}

function decidirUltimoQuandoPrecisaFazer(
  estado: EstadoEmJogo,
  avaliadas: CartaAvaliada[],
  necessidade: number,
): DecisaoLinhaFria {
  const vencedoras = cartasQueVencem(estado, avaliadas);
  if (vencedoras.length > 0) {
    return {
      carta: escolherVencedoraPorNecessidade(vencedoras, estado.manilha, necessidade).carta,
      motivo: 'precisa fazer; regra G[N-X]',
    };
  }

  return {
    carta: descartePorNecessidade(cartasQueNaoFazem(estado, avaliadas), estado.manilha, necessidade).carta,
    motivo: 'precisa fazer sem carta que vence; regra P[N-X]',
  };
}

function decidirUltimoQuandoJaCumpriu(estado: EstadoEmJogo, avaliadas: CartaAvaliada[]): DecisaoLinhaFria {
  const naoFazem = cartasQueNaoFazem(estado, avaliadas);
  if (naoFazem.length > 0) {
    return { carta: cartaMaisForte(naoFazem, estado.manilha).carta, motivo: 'já cumpriu; carta mais alta que não faz' };
  }

  return { carta: cartaMaisForte(avaliadas, estado.manilha).carta, motivo: 'já cumpriu; fuga impossível' };
}

function calcularNecessidade(estado: EstadoEmJogo, jogadorId: string): number {
  return (estado.declaracoes[jogadorId] ?? 0) - (estado.vazas[jogadorId] ?? 0);
}

function cartasQueVencem(estado: EstadoEmJogo, avaliadas: CartaAvaliada[]): CartaAvaliada[] {
  const melhor = melhorCartaMesa(estado.mesa, estado.manilha);
  if (!melhor) return [...avaliadas];
  return avaliadas.filter((avaliada) => cartaVence(avaliada.carta, melhor, estado.manilha));
}

function cartasQueNaoFazem(estado: EstadoEmJogo, avaliadas: CartaAvaliada[]): CartaAvaliada[] {
  const melhor = melhorCartaMesa(estado.mesa, estado.manilha);
  if (!melhor) return [];
  return avaliadas.filter((avaliada) => !cartaVence(avaliada.carta, melhor, estado.manilha));
}

function melhorCartaMesa(mesa: MesaItem[], manilha: Carta['valor']): Carta | null {
  if (mesa.length === 0) return null;
  return mesa[calcularIndiceVencedor(mesa, manilha)].carta;
}

function cartaMaisForte(avaliadas: CartaAvaliada[], manilha: Carta['valor']): CartaAvaliada {
  const ordenadas = ordenarPorForcaReal(avaliadas, manilha);
  return ordenadas[ordenadas.length - 1];
}

function cartaMaisBarata(avaliadas: CartaAvaliada[]): CartaAvaliada {
  return [...avaliadas].sort((a, b) => a.score - b.score)[0];
}

function cartaMaisCara(avaliadas: CartaAvaliada[]): CartaAvaliada {
  return [...avaliadas].sort((a, b) => b.score - a.score)[0];
}

function ehUltimoDaMesa(estado: EstadoEmJogo): boolean {
  return estado.mesa.length === estado.maos.length - 1;
}
