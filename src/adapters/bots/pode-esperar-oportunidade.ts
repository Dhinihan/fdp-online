import type { CartaAvaliada } from '@/core/avaliador-carta';
import type { EstadoEmJogo } from '@/types/estado-rodada';
import { urgenciaAlta } from './contexto-posicao-mesa';
import type { ContextoJogadaQuente } from './contextoLinhaQuente';
import { descartePorNecessidade } from './escolhas-por-necessidade';
import type { DecisaoCartaQuente } from './regras-linha-quente';

export function podeEsperarOportunidade(contexto: ContextoJogadaQuente): boolean {
  return (
    contexto.necessidade > 0 &&
    !urgenciaAlta(contexto.necessidade, contexto.avaliadas.length) &&
    cartasQueNaoFazemVaza(contexto).length > 0
  );
}

export function escolherEsperarOportunidade(
  estado: EstadoEmJogo,
  contexto: ContextoJogadaQuente,
): DecisaoCartaQuente | null {
  if (!podeEsperarOportunidade(contexto)) return null;
  const candidatas = cartasQueNaoFazemVaza(contexto);
  const escolhida = descartePorNecessidade(candidatas, estado.manilha, contexto.necessidade);
  return { carta: escolhida.carta, motivo: 'espera oportunidade: descarte por necessidade' };
}

function cartasQueNaoFazemVaza(contexto: ContextoJogadaQuente): CartaAvaliada[] {
  return [...contexto.perdedoras, ...contexto.empates];
}
