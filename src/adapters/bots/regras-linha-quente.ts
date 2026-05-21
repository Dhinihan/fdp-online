import type { CartaAvaliada } from '@/core/avaliador-carta';
import type { Carta } from '@/core/Carta';
import type { EstadoEmJogo, MesaItem } from '@/types/estado-rodada';
import { calcularNecessidade, liderQuerVaza, type ContextoJogadaQuente } from './contextoLinhaQuente';

export function podeBifurcar(estado: EstadoEmJogo, contexto: ContextoJogadaQuente, liderBaixa: number): boolean {
  return (
    contexto.necessidade > 0 &&
    contexto.vencedoras.length > 0 &&
    mesaPodePunir(estado, contexto, liderBaixa) &&
    temSegurancaParaDepois(contexto) &&
    temPressaoAgora(contexto) &&
    temAlvo(estado, contexto.jogadorId)
  );
}

export function motivoSemBifurcacao(contexto: ContextoJogadaQuente): string {
  const urgencia = contexto.necessidade / contexto.avaliadas.length;
  if (contexto.necessidade > 0 && urgencia >= 0.66) return 'sem bifurcação: ambas fazem porque urgência >= 0.66';
  if (contexto.necessidade <= 0 && contexto.perdedoras.length === 0) return 'sem bifurcação: fuga impossível';
  return 'sem bifurcação: ambas não querem fazer e escolheram a mesma carta';
}

export function cartasIguais(a: Carta, b: Carta): boolean {
  return a.valor === b.valor && a.naipe === b.naipe;
}

export function escolherPressao(contexto: ContextoJogadaQuente): CartaAvaliada {
  const fuga = cartasDeFuga(contexto);
  if (fuga.length > 0) return cartaMaisCara(fuga);
  return cartaMaisBarata(vencedorasBaratasSemGarantida(contexto));
}

export function escolherTravessia(estado: EstadoEmJogo, contexto: ContextoJogadaQuente): CartaAvaliada | null {
  if (
    contexto.necessidade <= 0 ||
    contexto.folga > 1 ||
    !liderQuerVaza(estado) ||
    !temAlvo(estado, contexto.jogadorId)
  ) {
    return null;
  }
  const candidatas = contexto.vencedoras.filter((avaliada) => !ehGarantida(avaliada));
  return candidatas.length > 0 ? cartaMaisBarata(candidatas) : null;
}

export function escolherEmpate(contexto: ContextoJogadaQuente, liderAlta: number): CartaAvaliada | null {
  const lider = contexto.lider;
  if (!lider || lider.score <= liderAlta || contexto.empates.length === 0) return null;
  if (contexto.necessidade <= 0 || contexto.folga >= 2) return cartaMaisCara(contexto.empates);
  return null;
}

function mesaPodePunir(estado: EstadoEmJogo, contexto: ContextoJogadaQuente, liderBaixa: number): boolean {
  return Boolean(
    contexto.lider &&
    contexto.lider.score <= liderBaixa &&
    estado.mesa.some((item) => jogadorNaoQuerVaza(estado, item)),
  );
}

function temSegurancaParaDepois(contexto: ContextoJogadaQuente): boolean {
  return contexto.necessidade <= 1 && contexto.folga >= 1 && contexto.avaliadas.some(ehSeguraOuGarantida);
}

function temPressaoAgora(contexto: ContextoJogadaQuente): boolean {
  return cartasDeFuga(contexto).length > 0 || vencedorasBaratasSemGarantida(contexto).length > 0;
}

function cartasDeFuga(contexto: ContextoJogadaQuente): CartaAvaliada[] {
  return [...contexto.perdedoras, ...contexto.empates].filter((avaliada) => !ehSeguraOuGarantida(avaliada));
}

function vencedorasBaratasSemGarantida(contexto: ContextoJogadaQuente): CartaAvaliada[] {
  const candidatas = contexto.vencedoras.filter((avaliada) => !ehGarantida(avaliada));
  return candidatas.filter((carta) =>
    contexto.avaliadas.some((avaliada) => avaliada !== carta && ehGarantida(avaliada)),
  );
}

function temAlvo(estado: EstadoEmJogo, jogadorId: string): boolean {
  return Object.keys(estado.declaracoes).some((id) => id !== jogadorId && calcularNecessidade(estado, id) > 0);
}

function jogadorNaoQuerVaza(estado: EstadoEmJogo, item: MesaItem): boolean {
  return calcularNecessidade(estado, item.jogadorId) <= 0;
}

function ehSeguraOuGarantida(avaliada: CartaAvaliada): boolean {
  return avaliada.categoria === 'segura' || avaliada.categoria === 'garantida_agora';
}

function ehGarantida(avaliada: CartaAvaliada): boolean {
  return avaliada.categoria === 'garantida_agora';
}

function cartaMaisBarata(avaliadas: CartaAvaliada[]): CartaAvaliada {
  return [...avaliadas].sort((a, b) => a.score - b.score)[0];
}

function cartaMaisCara(avaliadas: CartaAvaliada[]): CartaAvaliada {
  return [...avaliadas].sort((a, b) => b.score - a.score)[0];
}
