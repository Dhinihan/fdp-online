import type { CartaAvaliada } from '@/core/avaliador-carta';
import type { EstadoEmJogo } from '@/types/estado-rodada';
import type { LeituraDaMesa } from './ler-mesa';
import { ehAltaOuMelhor } from './predicados-carta-avaliada';
import type { DecisaoCartaQuente } from './regras-linha-quente';
import { cartaMaisBarata } from './selecao-por-score';

export function podeAtravessar(estado: EstadoEmJogo, leitura: LeituraDaMesa): boolean {
  void estado;
  return (
    leitura.necessidade > 0 &&
    leitura.urgenciaAlta &&
    leitura.liderQuerVaza &&
    liderEhAltaPlus(leitura) &&
    vencedorasSemGarantida(leitura).length > 0
  );
}

export function escolherTravessia(estado: EstadoEmJogo, leitura: LeituraDaMesa): DecisaoCartaQuente | null {
  if (!podeAtravessar(estado, leitura)) return null;
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
