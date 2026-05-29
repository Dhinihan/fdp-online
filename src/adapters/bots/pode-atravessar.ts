import type { CartaAvaliada } from '@/core/avaliador-carta';
import type { EstadoEmJogo } from '@/types/estado-rodada';
import { liderQuerVaza, urgenciaAlta } from './contexto-posicao-mesa';
import type { ContextoJogadaQuente } from './contextoLinhaQuente';
import { ehAltaOuMelhor } from './predicados-carta-avaliada';
import type { DecisaoCartaQuente } from './regras-linha-quente';
import { cartaMaisBarata } from './selecao-por-score';

export function podeAtravessar(estado: EstadoEmJogo, contexto: ContextoJogadaQuente): boolean {
  return (
    contexto.necessidade > 0 &&
    urgenciaAlta(contexto.necessidade, contexto.avaliadas.length) &&
    liderQuerVaza(estado) &&
    liderEhAltaPlus(contexto) &&
    vencedorasSemGarantida(contexto).length > 0
  );
}

export function escolherTravessia(estado: EstadoEmJogo, contexto: ContextoJogadaQuente): DecisaoCartaQuente | null {
  if (!podeAtravessar(estado, contexto)) return null;
  const escolhida = cartaMaisBarata(vencedorasSemGarantida(contexto));
  return { carta: escolhida.carta, motivo: montarMotivoTravessia(contexto) };
}

function liderEhAltaPlus(contexto: ContextoJogadaQuente): boolean {
  return contexto.lider !== null && ehAltaOuMelhor(contexto.lider);
}

function vencedorasSemGarantida(contexto: ContextoJogadaQuente): CartaAvaliada[] {
  return contexto.vencedoras.filter((avaliada) => avaliada.categoria !== 'garantida_agora');
}

function montarMotivoTravessia(contexto: ContextoJogadaQuente): string {
  const urgencia = contexto.necessidade / contexto.avaliadas.length;
  return `atravessa: urgência ${urgencia.toFixed(2)}, líder alta+ precisa, vencedora mais barata sem garantida`;
}
