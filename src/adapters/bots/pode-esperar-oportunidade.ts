import type { EstadoEmJogo } from '@/types/estado-rodada';
import { descartePorNecessidade } from './escolhas-por-necessidade';
import { cartasQueNaoFazemVaza, type LeituraDaMesa } from './ler-mesa';
import type { DecisaoCartaQuente } from './regras-linha-quente';

export function podeEsperarOportunidade(leitura: LeituraDaMesa): boolean {
  return leitura.necessidade > 0 && !leitura.urgenciaAlta && cartasQueNaoFazemVaza(leitura).length > 0;
}

export function escolherEsperarOportunidade(estado: EstadoEmJogo, leitura: LeituraDaMesa): DecisaoCartaQuente | null {
  if (!podeEsperarOportunidade(leitura)) return null;
  const candidatas = cartasQueNaoFazemVaza(leitura);
  const escolhida = descartePorNecessidade(candidatas, estado.manilha, leitura.necessidade);
  return { carta: escolhida.carta, motivo: 'espera oportunidade: descarte por necessidade' };
}
