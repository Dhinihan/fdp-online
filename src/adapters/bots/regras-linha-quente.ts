import type { CartaAvaliada } from '@/core/avaliador-carta';
import type { Carta } from '@/core/Carta';
import type { EstadoEmJogo } from '@/types/estado-rodada';
import { MOTIVOS_FUGA_MEIO, escolherFugaJaCumpriu } from './escolher-fuga-ja-cumpriu';
import { existeGarantidaParaDepois } from './garantida-para-depois';
import type { LeituraDaMesa } from './ler-mesa';
import { cartaMaisBarata, cartaMaisCara } from './selecao-por-score';

export interface ResultadoPodeBifurcar {
  pode: boolean;
  motivoRecusa?: string;
}

export interface DecisaoCartaQuente {
  carta: Carta;
  motivo: string;
}

export function podeBifurcar(leitura: LeituraDaMesa, liderBaixa: number): ResultadoPodeBifurcar {
  if (leitura.necessidade <= 0) return { pode: false, motivoRecusa: 'sem necessidade' };
  if (leitura.vencedoras.length === 0) return { pode: false, motivoRecusa: 'sem vencedoras' };
  if (!mesaPodePunir(leitura, liderBaixa)) return { pode: false, motivoRecusa: 'mesa não pode punir' };
  if (!temSegurancaParaDepois(leitura)) return { pode: false, motivoRecusa: 'sem segurança para depois' };
  if (!temPressaoAgora(leitura)) return { pode: false, motivoRecusa: 'sem pressão agora' };
  if (!leitura.temAlvo) return { pode: false, motivoRecusa: 'sem alvo na mesa' };
  return { pode: true };
}

export function cartasIguais(a: Carta, b: Carta): boolean {
  return a.valor === b.valor && a.naipe === b.naipe;
}

export function escolherPressao(leitura: LeituraDaMesa): DecisaoCartaQuente {
  const fuga = cartasDeFuga(leitura);
  if (fuga.length > 0) return { carta: cartaMaisCara(fuga).carta, motivo: 'pressão: fuga mais cara' };
  return {
    carta: cartaMaisBarata(vencedorasBaratasSemGarantida(leitura)).carta,
    motivo: 'pressão: vencedora barata sem garantida',
  };
}

export function escolherJaCumpriuNoMeio(estado: EstadoEmJogo, leitura: LeituraDaMesa): DecisaoCartaQuente | null {
  if (leitura.necessidade > 0) return null;
  return escolherFugaJaCumpriu(estado, leitura, {
    liderInteressado: leitura.liderQuerVaza,
    fallbackSemFuga: 'null',
    motivos: MOTIVOS_FUGA_MEIO,
  });
}

function mesaPodePunir(leitura: LeituraDaMesa, liderBaixa: number): boolean {
  return Boolean(leitura.lider && leitura.lider.score <= liderBaixa && leitura.mesaTemQuemNaoQuerVaza);
}

function temSegurancaParaDepois(leitura: LeituraDaMesa): boolean {
  return leitura.necessidade <= 1 && leitura.folga >= 1 && leitura.avaliadas.some(ehSeguraOuGarantida);
}

function temPressaoAgora(leitura: LeituraDaMesa): boolean {
  return cartasDeFuga(leitura).length > 0 || vencedorasBaratasSemGarantida(leitura).length > 0;
}

function cartasDeFuga(leitura: LeituraDaMesa): CartaAvaliada[] {
  return [...leitura.perdedoras, ...leitura.empates].filter((avaliada) => !ehSeguraOuGarantida(avaliada));
}

function vencedorasBaratasSemGarantida(leitura: LeituraDaMesa): CartaAvaliada[] {
  if (!existeGarantidaParaDepois(leitura)) return [];
  return leitura.vencedoras.filter((avaliada) => !ehGarantida(avaliada));
}

function ehSeguraOuGarantida(avaliada: CartaAvaliada): boolean {
  return avaliada.categoria === 'segura' || avaliada.categoria === 'garantida_agora';
}

function ehGarantida(avaliada: CartaAvaliada): boolean {
  return avaliada.categoria === 'garantida_agora';
}
