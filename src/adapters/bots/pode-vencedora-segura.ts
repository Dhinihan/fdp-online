import type { CartaAvaliada } from '@/core/avaliador-carta';
import { existeGarantidaParaDepois } from './garantida-para-depois';
import type { LeituraDaMesa } from './ler-mesa';
import { ehAltaOuMelhor } from './predicados-carta-avaliada';
import type { DecisaoCartaQuente } from './regras-linha-quente';
import { cartaMaisBarata } from './selecao-por-score';

function podeTentarComVencedoraSegura(leitura: LeituraDaMesa): boolean {
  return (
    leitura.necessidade > 0 &&
    leitura.vencedoras.length > 0 &&
    !leitura.urgenciaAlta &&
    !existeGarantidaParaDepois(leitura) &&
    leitura.liderQuerVaza &&
    liderEhAltaPlus(leitura) &&
    vencedorasSeguras(leitura).length > 0
  );
}

export function escolherVencedoraSegura(leitura: LeituraDaMesa): DecisaoCartaQuente | null {
  if (!podeTentarComVencedoraSegura(leitura)) return null;
  const escolhida = cartaMaisBarata(vencedorasSeguras(leitura));
  return {
    carta: escolhida.carta,
    motivo: 'vencedora segura: líder alta+ precisa, sem garantida para depois',
  };
}

function liderEhAltaPlus(leitura: LeituraDaMesa): boolean {
  return leitura.lider !== null && ehAltaOuMelhor(leitura.lider);
}

function vencedorasSeguras(leitura: LeituraDaMesa): CartaAvaliada[] {
  return leitura.vencedoras.filter((avaliada) => avaliada.categoria === 'segura');
}
