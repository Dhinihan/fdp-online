import { avaliarCartas, type CartaAvaliada } from '@/core/avaliador-carta';
import type { Carta } from '@/core/Carta';
import { calcularIndiceVencedor, cartaVence } from '@/core/comparador-carta';
import type { DecisorJogada } from '@/core/portas/DecisorJogada';
import { estadoEmJogo, type EstadoEmJogo, type MesaItem, type EstadoRodada } from '@/types/estado-rodada';
import { calcularNecessidade, ehUltimoDaMesa } from './contexto-posicao-mesa';
import { criarCaminhoJogadaDebug } from './debug-jogada-bot';
import { decidirAberturaLinhaFria } from './decidirAbertura';
import { cartaMaisForte, descartePorNecessidade, escolherVencedoraPorNecessidade } from './escolhas-por-necessidade';
import { avaliarGuardaDePosicao, type GuardaPosicao } from './guarda-posicao';

export interface DecisaoLinhaFria {
  carta: Carta;
  motivo: string;
  caminho?: string[];
}

const CAMINHO_MEIO = ['jogada', 'joga no meio', 'linha fria'] as const;

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
  const caminho = criarCaminhoJogadaDebug('meio', 'fria', 'já cumpriu');
  const naoFazem = cartasQueNaoFazem(estado, avaliadas);
  if (naoFazem.length === 0) {
    return { carta: cartaMaisBarata(avaliadas).carta, motivo: 'já cumpriu; fuga impossível', caminho };
  }
  return { carta: cartaMaisCara(naoFazem).carta, motivo: 'já cumpriu; carta mais alta que não faz', caminho };
}

function buscarVazaNaoUltimo(estado: EstadoEmJogo, avaliadas: CartaAvaliada[], necessidade: number): DecisaoLinhaFria {
  const vencedoras = cartasQueVencem(estado, avaliadas);
  const guarda = avaliarGuardaDePosicao({
    estado,
    necessidade,
    tamanhoMao: avaliadas.length,
    temGarantidaAgora: temGarantidaAgora(vencedoras),
  });
  const contexto = { estado, avaliadas, necessidade, guarda, vencedoras };
  if (!guarda.permite) return descartarComGuardaBloqueada(contexto);
  return decidirComGuardaPermitida(contexto);
}

interface ContextoBuscaVaza {
  estado: EstadoEmJogo;
  avaliadas: CartaAvaliada[];
  necessidade: number;
  guarda: GuardaPosicao;
  vencedoras: CartaAvaliada[];
}

function decidirComGuardaPermitida(contexto: ContextoBuscaVaza): DecisaoLinhaFria {
  const { estado, avaliadas, necessidade, guarda, vencedoras } = contexto;
  const caminho = [...CAMINHO_MEIO, 'guarda de posição permitiu'];
  if (vencedoras.length > 0) {
    return {
      carta: escolherVencedoraPorNecessidade(vencedoras, estado.manilha, necessidade).carta,
      motivo: motivoGuardaPermitiu(guarda.motivo, 'precisa fazer; regra G[N-X]'),
      caminho,
    };
  }

  const naoFazem = cartasQueNaoFazem(estado, avaliadas);
  if (naoFazem.length > 0) {
    return {
      carta: descartePorNecessidade(naoFazem, estado.manilha, necessidade).carta,
      motivo: motivoGuardaPermitiu(guarda.motivo, 'precisa fazer; regra P[N-X]'),
      caminho,
    };
  }
  return {
    carta: cartaMaisBarata(avaliadas).carta,
    motivo: motivoGuardaPermitiu(guarda.motivo, 'precisa fazer; carta mais barata'),
    caminho,
  };
}

function descartarComGuardaBloqueada(contexto: ContextoBuscaVaza): DecisaoLinhaFria {
  const { estado, avaliadas, necessidade, guarda } = contexto;
  const caminho = [...CAMINHO_MEIO, 'guarda de posição bloqueou'];
  const naoFazem = cartasQueNaoFazem(estado, avaliadas);
  if (naoFazem.length > 0) {
    return {
      carta: descartePorNecessidade(naoFazem, estado.manilha, necessidade).carta,
      motivo: motivoGuardaBloqueou(guarda.motivo),
      caminho,
    };
  }
  return {
    carta: cartaMaisBarata(avaliadas).carta,
    motivo: `${motivoGuardaBloqueou(guarda.motivo)}; fuga impossível`,
    caminho,
  };
}

function motivoGuardaPermitiu(motivoGuarda: string, sufixo: string): string {
  return `guarda de posição permitiu; ${motivoGuarda}; ${sufixo}`;
}

function motivoGuardaBloqueou(motivoGuarda: string): string {
  return `guarda de posição bloqueou; ${motivoGuarda}`;
}

function temGarantidaAgora(vencedoras: CartaAvaliada[]): boolean {
  return vencedoras.some((avaliada) => avaliada.categoria === 'garantida_agora');
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
  const caminho = criarCaminhoJogadaDebug('fecha', 'fria', 'precisa fazer');
  const vencedoras = cartasQueVencem(estado, avaliadas);
  if (vencedoras.length > 0) {
    return {
      carta: escolherVencedoraPorNecessidade(vencedoras, estado.manilha, necessidade).carta,
      motivo: 'precisa fazer; regra G[N-X]',
      caminho,
    };
  }

  return {
    carta: descartePorNecessidade(cartasQueNaoFazem(estado, avaliadas), estado.manilha, necessidade).carta,
    motivo: 'precisa fazer sem carta que vence; regra P[N-X]',
    caminho,
  };
}

function decidirUltimoQuandoJaCumpriu(estado: EstadoEmJogo, avaliadas: CartaAvaliada[]): DecisaoLinhaFria {
  const caminho = criarCaminhoJogadaDebug('fecha', 'fria', 'já cumpriu');
  const naoFazem = cartasQueNaoFazem(estado, avaliadas);
  if (naoFazem.length > 0) {
    return {
      carta: cartaMaisForte(naoFazem, estado.manilha).carta,
      motivo: 'já cumpriu; carta mais forte que não faz',
      caminho,
    };
  }

  return { carta: cartaMaisForte(avaliadas, estado.manilha).carta, motivo: 'já cumpriu; fuga impossível', caminho };
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

function cartaMaisBarata(avaliadas: CartaAvaliada[]): CartaAvaliada {
  return [...avaliadas].sort((a, b) => a.score - b.score)[0];
}

function cartaMaisCara(avaliadas: CartaAvaliada[]): CartaAvaliada {
  return [...avaliadas].sort((a, b) => b.score - a.score)[0];
}
