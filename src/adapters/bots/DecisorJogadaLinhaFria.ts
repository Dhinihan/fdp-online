import { avaliarCartas, type CartaAvaliada } from '@/core/avaliador-carta';
import type { Carta } from '@/core/Carta';
import { calcularIndiceVencedor, cartaVence, compararForcaReal } from '@/core/comparador-carta';
import type { DecisorJogada } from '@/core/portas/DecisorJogada';
import { estadoEmJogo, type EstadoEmJogo, type MesaItem, type EstadoRodada } from '@/types/estado-rodada';
import { decidirAbertura } from './decidirAbertura';

export interface DecisaoLinhaFria {
  carta: Carta;
  motivo: string;
}

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

    if (ehUltimoDaMesa(estadoAtual)) return Promise.resolve(decidirUltimoLinhaFria(mao, estadoAtual).carta);
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
      carta: escolherGanhadora(vencedoras, estado.manilha, necessidade).carta,
      motivo: 'precisa fazer; regra G[N-X]',
    };
  }

  return {
    carta: escolherPerdedora(cartasQueNaoFazem(estado, avaliadas), estado.manilha, necessidade).carta,
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

function cartasQuePerdem(estado: EstadoEmJogo, avaliadas: CartaAvaliada[]): CartaAvaliada[] {
  const melhor = melhorCartaMesa(estado.mesa, estado.manilha);
  if (!melhor) return [];
  return avaliadas.filter((avaliada) => !cartaVence(avaliada.carta, melhor, estado.manilha));
}

function cartasQueNaoFazem(estado: EstadoEmJogo, avaliadas: CartaAvaliada[]): CartaAvaliada[] {
  return cartasQuePerdem(estado, avaliadas);
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
