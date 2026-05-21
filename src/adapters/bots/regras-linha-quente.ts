import { avaliarCartas, type CartaAvaliada } from '@/core/avaliador-carta';
import type { Carta } from '@/core/Carta';
import { calcularIndiceVencedor, cartasEmpatam, cartaVence } from '@/core/comparador-carta';
import type { EstadoEmJogo, MesaItem } from '@/types/estado-rodada';

export interface ContextoJogada {
  jogadorId: string;
  necessidade: number;
  folga: number;
  avaliadas: CartaAvaliada[];
  vencedoras: CartaAvaliada[];
  perdedoras: CartaAvaliada[];
  lider: CartaAvaliada | null;
}

export function criarContexto(estado: EstadoEmJogo, mao: Carta[]): ContextoJogada {
  const jogadorId = estado.maos[estado.jogadorAtual].jogador.id;
  const necessidade = calcularNecessidade(estado, jogadorId);
  const avaliadas = avaliarCartas(mao, estado.manilha, estado.cartasReveladas, estado.maos.length);
  const lider = avaliarLider(estado);
  return {
    jogadorId,
    necessidade,
    folga: mao.length - necessidade,
    avaliadas,
    vencedoras: lider ? avaliadas.filter((a) => cartaVence(a.carta, lider.carta, estado.manilha)) : [...avaliadas],
    perdedoras: lider ? avaliadas.filter((a) => !cartaVence(a.carta, lider.carta, estado.manilha)) : [],
    lider,
  };
}

export function podeBifurcar(estado: EstadoEmJogo, contexto: ContextoJogada, liderBaixa: number): boolean {
  return (
    contexto.necessidade > 0 &&
    contexto.vencedoras.length > 0 &&
    mesaPodePunir(estado, contexto, liderBaixa) &&
    temSegurancaParaDepois(contexto) &&
    temPressaoAgora(contexto) &&
    temAlvo(estado, contexto.jogadorId)
  );
}

export function motivoSemBifurcacao(contexto: ContextoJogada): string {
  const urgencia = contexto.necessidade / contexto.avaliadas.length;
  if (contexto.necessidade > 0 && urgencia >= 0.66) return 'sem bifurcação: ambas fazem porque urgência >= 0.66';
  if (contexto.necessidade <= 0 && contexto.perdedoras.length === 0) return 'sem bifurcação: fuga impossível';
  return 'sem bifurcação: ambas não querem fazer e escolheram a mesma carta';
}

export function cartasIguais(a: Carta, b: Carta): boolean {
  return a.valor === b.valor && a.naipe === b.naipe;
}

export function escolherPressao(contexto: ContextoJogada): CartaAvaliada {
  const fuga = cartasDeFuga(contexto);
  if (fuga.length > 0) return cartaMaisCara(fuga);
  return cartaMaisBarata(vencedorasBaratasSemGarantida(contexto));
}

export function escolherTravessia(estado: EstadoEmJogo, contexto: ContextoJogada): CartaAvaliada | null {
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

export function escolherEmpate(
  estado: EstadoEmJogo,
  contexto: ContextoJogada,
  liderAlta: number,
): CartaAvaliada | null {
  const lider = contexto.lider;
  if (!lider || lider.score <= liderAlta) return null;
  const empates = contexto.avaliadas.filter((avaliada) => cartasEmpatam(avaliada.carta, lider.carta, estado.manilha));
  if (empates.length === 0) return null;
  if (contexto.necessidade <= 0 || contexto.folga >= 2) return cartaMaisCara(empates);
  return null;
}

function mesaPodePunir(estado: EstadoEmJogo, contexto: ContextoJogada, liderBaixa: number): boolean {
  return Boolean(
    contexto.lider &&
    contexto.lider.score <= liderBaixa &&
    estado.mesa.some((item) => jogadorNaoQuerVaza(estado, item)),
  );
}

function temSegurancaParaDepois(contexto: ContextoJogada): boolean {
  return contexto.necessidade <= 1 && contexto.folga >= 1 && contexto.avaliadas.some(ehSeguraOuGarantida);
}

function temPressaoAgora(contexto: ContextoJogada): boolean {
  return cartasDeFuga(contexto).length > 0 || vencedorasBaratasSemGarantida(contexto).length > 0;
}

function cartasDeFuga(contexto: ContextoJogada): CartaAvaliada[] {
  return contexto.perdedoras.filter((avaliada) => !ehSeguraOuGarantida(avaliada));
}

function vencedorasBaratasSemGarantida(contexto: ContextoJogada): CartaAvaliada[] {
  const candidatas = contexto.vencedoras.filter((avaliada) => !ehGarantida(avaliada));
  return candidatas.filter((carta) =>
    contexto.avaliadas.some((avaliada) => avaliada !== carta && ehGarantida(avaliada)),
  );
}

function avaliarLider(estado: EstadoEmJogo): CartaAvaliada | null {
  const carta = melhorCartaMesa(estado.mesa, estado.manilha);
  if (!carta) return null;
  return avaliarCartas([carta], estado.manilha, estado.cartasReveladas, estado.maos.length)[0];
}

function melhorCartaMesa(mesa: MesaItem[], manilha: Carta['valor']): Carta | null {
  if (mesa.length === 0) return null;
  return mesa[calcularIndiceVencedor(mesa, manilha)].carta;
}

function liderQuerVaza(estado: EstadoEmJogo): boolean {
  if (estado.mesa.length === 0) return false;
  const lider = estado.mesa[calcularIndiceVencedor(estado.mesa, estado.manilha)];
  return calcularNecessidade(estado, lider.jogadorId) > 0;
}

function temAlvo(estado: EstadoEmJogo, jogadorId: string): boolean {
  return Object.keys(estado.declaracoes).some((id) => id !== jogadorId && calcularNecessidade(estado, id) > 0);
}

function jogadorNaoQuerVaza(estado: EstadoEmJogo, item: MesaItem): boolean {
  return calcularNecessidade(estado, item.jogadorId) <= 0;
}

function calcularNecessidade(estado: EstadoEmJogo, jogadorId: string): number {
  return (estado.declaracoes[jogadorId] ?? 0) - (estado.vazas[jogadorId] ?? 0);
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
