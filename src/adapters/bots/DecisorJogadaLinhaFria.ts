import { avaliarCartas, type CartaAvaliada } from '@/core/avaliador-carta';
import type { Carta } from '@/core/Carta';
import { calcularIndiceVencedor, cartaVence, compararForcaReal } from '@/core/comparador-carta';
import type { DecisorJogada } from '@/core/portas/DecisorJogada';
import { estadoEmJogo, type EstadoEmJogo, type MesaItem, type EstadoRodada } from '@/types/estado-rodada';
import { decidirAbertura } from './decidirAbertura';

export class DecisorJogadaLinhaFria implements DecisorJogada {
  decidirJogada(mao: Carta[], estado: EstadoRodada): Promise<Carta> {
    if (mao.length === 0) return Promise.reject(new Error('Mão vazia'));

    const estadoAtual = estadoEmJogo(estado);
    if (estadoAtual.mesa.length === 0) {
      return Promise.resolve(decidirAbertura(mao, estadoAtual, { temperatura: 0 }));
    }

    const avaliadas = avaliarCartas(mao, estadoAtual.manilha, estadoAtual.cartasReveladas, estadoAtual.maos.length);
    const jogadorId = estadoAtual.maos[estadoAtual.jogadorAtual].jogador.id;
    const necessidade = calcularNecessidade(estadoAtual, jogadorId);

    if (necessidade <= 0) return Promise.resolve(this.fugir(estadoAtual, avaliadas));
    return Promise.resolve(this.buscarVaza(estadoAtual, avaliadas, necessidade));
  }

  private fugir(estado: EstadoEmJogo, avaliadas: CartaAvaliada[]): Carta {
    const perdedoras = cartasQuePerdem(estado, avaliadas);
    if (ehUltimoDaMesa(estado)) return fugirNoFimDaMesa(estado, perdedoras, avaliadas);
    if (perdedoras.length === 0) return cartaMaisBarata(avaliadas).carta;
    return cartaMaisCara(perdedoras).carta;
  }

  private buscarVaza(estado: EstadoEmJogo, avaliadas: CartaAvaliada[], necessidade: number): Carta {
    const vencedoras = cartasQueVencem(estado, avaliadas);
    if (vencedoras.length > 0) return escolherGanhadora(vencedoras, estado.manilha, necessidade).carta;

    const perdedoras = cartasQuePerdem(estado, avaliadas);
    if (perdedoras.length > 0) return escolherPerdedora(perdedoras, estado.manilha, necessidade).carta;
    return cartaMaisBarata(avaliadas).carta;
  }
}

function calcularNecessidade(estado: EstadoEmJogo, jogadorId: string): number {
  return (estado.declaracoes[jogadorId] ?? 0) - (estado.vazas[jogadorId] ?? 0);
}

function cartasQueVencem(estado: EstadoEmJogo, avaliadas: CartaAvaliada[]): CartaAvaliada[] {
  const melhor = melhorCartaMesa(estado.mesa, estado.manilha);
  if (!melhor) return [...avaliadas];
  return avaliadas.filter((avaliada) => cartaVence(avaliada.carta, melhor, estado.manilha));
}

function cartasQuePerdem(estado: EstadoEmJogo, avaliadas: CartaAvaliada[]): CartaAvaliada[] {
  const melhor = melhorCartaMesa(estado.mesa, estado.manilha);
  if (!melhor) return [];
  return avaliadas.filter((avaliada) => !cartaVence(avaliada.carta, melhor, estado.manilha));
}

function melhorCartaMesa(mesa: MesaItem[], manilha: Carta['valor']): Carta | null {
  if (mesa.length === 0) return null;
  return mesa[calcularIndiceVencedor(mesa, manilha)].carta;
}

function escolherGanhadora(avaliadas: CartaAvaliada[], manilha: Carta['valor'], necessidade: number): CartaAvaliada {
  const ordenadas = ordenarPorForcaReal(avaliadas, manilha);
  const indice = ordenadas.length >= necessidade ? ordenadas.length - necessidade : 0;
  return ordenadas[indice];
}

function escolherPerdedora(avaliadas: CartaAvaliada[], manilha: Carta['valor'], necessidade: number): CartaAvaliada {
  const ordenadas = ordenarPorForcaReal(avaliadas, manilha);
  const indice = ordenadas.length > necessidade ? ordenadas.length - necessidade : 0;
  return ordenadas[indice];
}

function ordenarPorForcaReal(avaliadas: CartaAvaliada[], manilha: Carta['valor']): CartaAvaliada[] {
  return [...avaliadas].sort((a, b) => compararForcaReal(a.carta, b.carta, manilha));
}

function fugirNoFimDaMesa(estado: EstadoEmJogo, perdedoras: CartaAvaliada[], avaliadas: CartaAvaliada[]): Carta {
  if (perdedoras.length > 0) return cartaMaisForte(perdedoras, estado.manilha).carta;
  return cartaMaisForte(avaliadas, estado.manilha).carta;
}

function cartaMaisForte(avaliadas: CartaAvaliada[], manilha: Carta['valor']): CartaAvaliada {
  return ordenarPorForcaReal(avaliadas, manilha).at(-1) ?? avaliadas[0];
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
