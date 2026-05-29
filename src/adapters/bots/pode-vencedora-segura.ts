import type { CartaAvaliada } from '@/core/avaliador-carta';
import type { EstadoEmJogo } from '@/types/estado-rodada';
import { liderQuerVaza, urgenciaAlta } from './contexto-posicao-mesa';
import type { ContextoJogadaQuente } from './contextoLinhaQuente';
import { existeGarantidaParaDepois } from './garantida-para-depois';
import { ehAltaOuMelhor } from './predicados-carta-avaliada';
import type { DecisaoCartaQuente } from './regras-linha-quente';
import { cartaMaisBarata } from './selecao-por-score';

export function podeTentarComVencedoraSegura(estado: EstadoEmJogo, contexto: ContextoJogadaQuente): boolean {
  // "existe jogador interessado" (doc) é subsumido por liderQuerVaza: se o líder
  // ainda precisa fazer, já existe um jogador interessado na mesa.
  return (
    contexto.necessidade > 0 &&
    contexto.vencedoras.length > 0 &&
    !urgenciaAlta(contexto.necessidade, contexto.avaliadas.length) &&
    !existeGarantidaParaDepois(contexto) &&
    liderQuerVaza(estado) &&
    liderEhAltaPlus(contexto) &&
    vencedorasSeguras(contexto).length > 0
  );
}

export function escolherVencedoraSegura(
  estado: EstadoEmJogo,
  contexto: ContextoJogadaQuente,
): DecisaoCartaQuente | null {
  if (!podeTentarComVencedoraSegura(estado, contexto)) return null;
  const escolhida = cartaMaisBarata(vencedorasSeguras(contexto));
  return {
    carta: escolhida.carta,
    motivo: 'vencedora segura: líder alta+ precisa, sem garantida para depois',
  };
}

function liderEhAltaPlus(contexto: ContextoJogadaQuente): boolean {
  return contexto.lider !== null && ehAltaOuMelhor(contexto.lider);
}

function vencedorasSeguras(contexto: ContextoJogadaQuente): CartaAvaliada[] {
  return contexto.vencedoras.filter((avaliada) => avaliada.categoria === 'segura');
}
