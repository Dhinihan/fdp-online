import type { CartaAvaliada } from '@/core/avaliador-carta';
import type { LeituraDaMesa } from './ler-mesa';
import { ehAltaOuMelhor } from './predicados-carta-avaliada';
import type { DecisaoCartaQuente } from './regras-linha-quente';
import { cartaMaisBarata } from './selecao-por-score';

function podeAtravessar(leitura: LeituraDaMesa): boolean {
  return (
    leitura.necessidade > 0 &&
    leitura.urgenciaAlta &&
    leitura.liderQuerVaza &&
    liderEhAltaPlus(leitura) &&
    vencedorasSemGarantida(leitura).length > 0
  );
}

export function escolherTravessia(leitura: LeituraDaMesa): DecisaoCartaQuente | null {
  if (!podeAtravessar(leitura)) return null;
  const escolhida = cartaMaisBarata(vencedorasSemGarantida(leitura));
  return { carta: escolhida.carta, motivo: montarMotivoTravessia(leitura) };
}

function liderEhAltaPlus(leitura: LeituraDaMesa): boolean {
  return leitura.lider !== null && ehAltaOuMelhor(leitura.lider);
}

function vencedorasSemGarantida(leitura: LeituraDaMesa): CartaAvaliada[] {
  return leitura.vencedoras.filter((avaliada) => avaliada.categoria !== 'garantida_agora');
}

function montarMotivoTravessia(leitura: LeituraDaMesa): string {
  return `atravessa: urgência ${leitura.urgencia.toFixed(2)}, líder alta+ precisa, vencedora mais barata sem garantida`;
}
