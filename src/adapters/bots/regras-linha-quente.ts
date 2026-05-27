import type { CartaAvaliada } from '@/core/avaliador-carta';
import type { Carta } from '@/core/Carta';
import type { EstadoEmJogo, MesaItem } from '@/types/estado-rodada';
import { calcularNecessidade, liderQuerVaza, type ContextoJogadaQuente } from './contextoLinhaQuente';

export interface ResultadoPodeBifurcar {
  pode: boolean;
  motivoRecusa?: string;
}

export interface DecisaoCartaQuente {
  carta: Carta;
  motivo: string;
}

export function podeBifurcar(
  estado: EstadoEmJogo,
  contexto: ContextoJogadaQuente,
  liderBaixa: number,
): ResultadoPodeBifurcar {
  if (contexto.necessidade <= 0) return { pode: false, motivoRecusa: 'sem necessidade' };
  if (contexto.vencedoras.length === 0) return { pode: false, motivoRecusa: 'sem vencedoras' };
  if (!mesaPodePunir(estado, contexto, liderBaixa)) return { pode: false, motivoRecusa: 'mesa não pode punir' };
  if (!temSegurancaParaDepois(contexto)) return { pode: false, motivoRecusa: 'sem segurança para depois' };
  if (!temPressaoAgora(contexto)) return { pode: false, motivoRecusa: 'sem pressão agora' };
  if (!temAlvo(estado, contexto.jogadorId)) return { pode: false, motivoRecusa: 'sem alvo na mesa' };
  return { pode: true };
}

export function formatarMotivoRecusaBifurcacao(motivoRecusa: string): string {
  return `linha quente segue fria: ${motivoRecusa}`;
}

export function cartasIguais(a: Carta, b: Carta): boolean {
  return a.valor === b.valor && a.naipe === b.naipe;
}

export function escolherPressao(contexto: ContextoJogadaQuente): DecisaoCartaQuente {
  const fuga = cartasDeFuga(contexto);
  if (fuga.length > 0) return { carta: cartaMaisCara(fuga).carta, motivo: 'pressão: fuga mais cara' };
  return {
    carta: cartaMaisBarata(vencedorasBaratasSemGarantida(contexto)).carta,
    motivo: 'pressão: vencedora barata sem garantida',
  };
}

export function escolherTravessia(estado: EstadoEmJogo, contexto: ContextoJogadaQuente): DecisaoCartaQuente | null {
  if (
    contexto.necessidade <= 0 ||
    contexto.folga > 1 ||
    !liderQuerVaza(estado) ||
    !temAlvo(estado, contexto.jogadorId)
  ) {
    return null;
  }
  const candidatas = contexto.vencedoras.filter((avaliada) => !ehGarantida(avaliada));
  if (candidatas.length === 0) return null;
  return { carta: cartaMaisBarata(candidatas).carta, motivo: 'travessia: líder alta+ e urgência baixa' };
}

export function escolherEmpate(contexto: ContextoJogadaQuente, liderAlta: number): DecisaoCartaQuente | null {
  const lider = contexto.lider;
  if (!lider || lider.score <= liderAlta || contexto.empates.length === 0) return null;
  if (contexto.necessidade <= 0 || contexto.folga >= 2) {
    return { carta: cartaMaisCara(contexto.empates).carta, motivo: 'empate com líder alta+' };
  }
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
