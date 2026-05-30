import type { CartaAvaliada } from '@/core/avaliador-carta';
import type { Carta } from '@/core/Carta';
import type { DecisorJogada } from '@/core/portas/DecisorJogada';
import { estadoEmJogo, type EstadoEmJogo, type EstadoRodada } from '@/types/estado-rodada';
import { ehUltimoDaMesa } from './contexto-posicao-mesa';
import { decidirAberturaLinhaFria } from './decidirAbertura';
import { cartaMaisForte, descartePorNecessidade, escolherVencedoraPorNecessidade } from './escolhas-por-necessidade';
import { avaliarGuardaDePosicao, type GuardaPosicao } from './guarda-posicao';
import { cartasQueNaoFazemVaza, lerMesa, type LeituraDaMesa } from './ler-mesa';

export interface DecisaoLinhaFria {
  carta: Carta;
  motivo: string;
  etapa: string;
}

export class DecisorJogadaLinhaFria implements DecisorJogada {
  decidirJogada(mao: Carta[], estado: EstadoRodada): Promise<Carta> {
    if (mao.length === 0) return Promise.reject(new Error('Mão vazia'));

    const estadoAtual = estadoEmJogo(estado);
    const leitura = lerMesa(estadoAtual, mao);
    if (ehUltimoDaMesa(estadoAtual)) return Promise.resolve(decidirUltimoLinhaFria(leitura, estadoAtual).carta);
    return Promise.resolve(decidirNaoUltimoLinhaFria(leitura, estadoAtual).carta);
  }
}

export function decidirNaoUltimoLinhaFria(leitura: LeituraDaMesa, estado: EstadoEmJogo): DecisaoLinhaFria {
  if (estado.mesa.length === 0) {
    return decidirAberturaLinhaFria(leitura);
  }

  if (leitura.necessidade <= 0) return fugirNaoUltimo(leitura);
  return buscarVazaNaoUltimo(leitura, estado);
}

function fugirNaoUltimo(leitura: LeituraDaMesa): DecisaoLinhaFria {
  const naoFazem = cartasQueNaoFazemVaza(leitura);
  if (naoFazem.length === 0) {
    return {
      carta: cartaMaisBarata(leitura.avaliadas).carta,
      motivo: 'já cumpriu; fuga impossível',
      etapa: 'já cumpriu',
    };
  }
  return {
    carta: cartaMaisCara(naoFazem).carta,
    motivo: 'já cumpriu; carta mais alta que não faz',
    etapa: 'já cumpriu',
  };
}

function buscarVazaNaoUltimo(leitura: LeituraDaMesa, estado: EstadoEmJogo): DecisaoLinhaFria {
  const guarda = avaliarGuardaDePosicao(leitura);
  const contexto = { estado, leitura, guarda };
  if (!guarda.permite) return descartarComGuardaBloqueada(contexto);
  return decidirComGuardaPermitida(contexto);
}

interface ContextoBuscaVaza {
  estado: EstadoEmJogo;
  leitura: LeituraDaMesa;
  guarda: GuardaPosicao;
}

function decidirComGuardaPermitida(contexto: ContextoBuscaVaza): DecisaoLinhaFria {
  const { estado, leitura, guarda } = contexto;
  const etapa = 'guarda de posição permitiu';
  if (leitura.vencedoras.length > 0) {
    return {
      carta: escolherVencedoraPorNecessidade(leitura.vencedoras, estado.manilha, leitura.necessidade).carta,
      motivo: motivoGuardaPermitiu(guarda.motivo, 'precisa fazer; regra G[N-X]'),
      etapa,
    };
  }

  const naoFazem = cartasQueNaoFazemVaza(leitura);
  if (naoFazem.length > 0) {
    return {
      carta: descartePorNecessidade(naoFazem, estado.manilha, leitura.necessidade).carta,
      motivo: motivoGuardaPermitiu(guarda.motivo, 'precisa fazer; regra P[N-X]'),
      etapa,
    };
  }
  return {
    carta: cartaMaisBarata(leitura.avaliadas).carta,
    motivo: motivoGuardaPermitiu(guarda.motivo, 'precisa fazer; carta mais barata'),
    etapa,
  };
}

function descartarComGuardaBloqueada(contexto: ContextoBuscaVaza): DecisaoLinhaFria {
  const { estado, leitura, guarda } = contexto;
  const etapa = 'guarda de posição bloqueou';
  const naoFazem = cartasQueNaoFazemVaza(leitura);
  if (naoFazem.length > 0) {
    return {
      carta: descartePorNecessidade(naoFazem, estado.manilha, leitura.necessidade).carta,
      motivo: motivoGuardaBloqueou(guarda.motivo),
      etapa,
    };
  }
  return {
    carta: cartaMaisBarata(leitura.avaliadas).carta,
    motivo: `${motivoGuardaBloqueou(guarda.motivo)}; fuga impossível`,
    etapa,
  };
}

function motivoGuardaPermitiu(motivoGuarda: string, sufixo: string): string {
  return `guarda de posição permitiu; ${motivoGuarda}; ${sufixo}`;
}

function motivoGuardaBloqueou(motivoGuarda: string): string {
  return `guarda de posição bloqueou; ${motivoGuarda}`;
}

export function decidirUltimoLinhaFria(leitura: LeituraDaMesa, estado: EstadoEmJogo): DecisaoLinhaFria {
  if (leitura.necessidade > 0) return decidirUltimoQuandoPrecisaFazer(leitura, estado);
  return decidirUltimoQuandoJaCumpriu(leitura, estado);
}

function decidirUltimoQuandoPrecisaFazer(leitura: LeituraDaMesa, estado: EstadoEmJogo): DecisaoLinhaFria {
  if (leitura.vencedoras.length > 0) {
    return {
      carta: escolherVencedoraPorNecessidade(leitura.vencedoras, estado.manilha, leitura.necessidade).carta,
      motivo: 'precisa fazer; regra G[N-X]',
      etapa: 'precisa fazer',
    };
  }

  return {
    carta: descartePorNecessidade(cartasQueNaoFazemVaza(leitura), estado.manilha, leitura.necessidade).carta,
    motivo: 'precisa fazer sem carta que vence; regra P[N-X]',
    etapa: 'precisa fazer',
  };
}

function decidirUltimoQuandoJaCumpriu(leitura: LeituraDaMesa, estado: EstadoEmJogo): DecisaoLinhaFria {
  const naoFazem = cartasQueNaoFazemVaza(leitura);
  if (naoFazem.length > 0) {
    return {
      carta: cartaMaisForte(naoFazem, estado.manilha).carta,
      motivo: 'já cumpriu; carta mais forte que não faz',
      etapa: 'já cumpriu',
    };
  }

  return {
    carta: cartaMaisForte(leitura.avaliadas, estado.manilha).carta,
    motivo: 'já cumpriu; fuga impossível',
    etapa: 'já cumpriu',
  };
}

function cartaMaisBarata(avaliadas: CartaAvaliada[]): CartaAvaliada {
  return [...avaliadas].sort((a, b) => a.score - b.score)[0];
}

function cartaMaisCara(avaliadas: CartaAvaliada[]): CartaAvaliada {
  return [...avaliadas].sort((a, b) => b.score - a.score)[0];
}
