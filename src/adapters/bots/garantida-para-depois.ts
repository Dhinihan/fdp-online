import type { ContextoJogadaQuente } from './contextoLinhaQuente';

export function existeGarantidaParaDepois(contexto: ContextoJogadaQuente): boolean {
  return contexto.avaliadas.some((avaliada) => avaliada.categoria === 'garantida_agora');
}
