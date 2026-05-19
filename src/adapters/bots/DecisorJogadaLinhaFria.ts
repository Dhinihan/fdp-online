import { avaliarCartas, type CartaAvaliada } from '@/core/avaliador-carta';
import type { Carta } from '@/core/Carta';
import { calcularIndiceVencedor, cartaVence } from '@/core/comparador-carta';
import type { DecisorJogada } from '@/core/portas/DecisorJogada';
import { estadoEmJogo, type EstadoEmJogo, type MesaItem, type EstadoRodada } from '@/types/estado-rodada';

export class DecisorJogadaLinhaFria implements DecisorJogada {
  decidirJogada(mao: Carta[], estado: EstadoRodada): Promise<Carta> {
    if (mao.length === 0) return Promise.reject(new Error('Mão vazia'));

    const estadoAtual = estadoEmJogo(estado);
    const avaliadas = avaliarCartas(mao, estadoAtual.manilha, estadoAtual.cartasReveladas, estadoAtual.maos.length);
    const jogadorId = estadoAtual.maos[estadoAtual.jogadorAtual].jogador.id;
    const necessidade = calcularNecessidade(estadoAtual, jogadorId);

    if (necessidade <= 0) return Promise.resolve(this.fugir(estadoAtual, avaliadas));
    return Promise.resolve(this.buscarVaza(estadoAtual, avaliadas));
  }

  private fugir(estado: EstadoEmJogo, avaliadas: CartaAvaliada[]): Carta {
    const perdedoras = cartasQuePerdem(estado, avaliadas);
    if (perdedoras.length === 0) return cartaMaisBarata(avaliadas).carta;
    if (ehUltimoDaMesa(estado) && liderPrecisaFazer(estado)) return cartaMaisBarata(perdedoras).carta;
    return cartaMaisCara(perdedoras).carta;
  }

  private buscarVaza(estado: EstadoEmJogo, avaliadas: CartaAvaliada[]): Carta {
    const vencedoras = cartasQueVencem(estado, avaliadas);
    if (vencedoras.length > 0) return escolherVencedoraFria(vencedoras).carta;

    const perdedoras = cartasQuePerdem(estado, avaliadas);
    if (perdedoras.length > 0) return cartaMaisCara(perdedoras).carta;
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

function escolherVencedoraFria(avaliadas: CartaAvaliada[]): CartaAvaliada {
  const naoGarantidas = avaliadas.filter((avaliada) => avaliada.categoria !== 'garantida_agora');
  return cartaMaisBarata(naoGarantidas.length > 0 ? naoGarantidas : avaliadas);
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

function liderPrecisaFazer(estado: EstadoEmJogo): boolean {
  const indice = calcularIndiceVencedor(estado.mesa, estado.manilha);
  return calcularNecessidade(estado, estado.mesa[indice].jogadorId) > 0;
}
