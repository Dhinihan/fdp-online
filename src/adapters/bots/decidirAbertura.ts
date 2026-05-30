import type { CategoriaCarta } from '@/core/avaliador-carta';
import type { Carta } from '@/core/Carta';
import { criarCaminhoJogadaDebug } from './debug-jogada-bot';
import type { LeituraDaMesa } from './ler-mesa';

export interface DecisaoAbertura {
  carta: Carta;
  motivo: string;
  caminho: string[];
}

export type DecisaoAberturaLinhaFria = DecisaoAbertura;

export const MOTIVO_ABERTURA_LINHA_QUENTE = 'abertura: segue linha fria';

export function decidirAberturaLinhaFria(leitura: LeituraDaMesa): DecisaoAberturaLinhaFria {
  if (leitura.avaliadas.length === 0) throw new Error('decidirAbertura: mão vazia');
  const ramo = definirRamoAbertura(leitura.necessidade, leitura.urgenciaAlta);
  const ordemCategorias = definirOrdemCategorias(ramo);

  for (const cat of ordemCategorias) {
    const daCategoria = leitura.avaliadas.filter((a) => a.categoria === cat);
    if (daCategoria.length > 0) {
      return criarDecisaoAbertura([...daCategoria].sort((a, b) => a.score - b.score)[0].carta, ramo, ordemCategorias);
    }
  }

  return criarDecisaoAbertura(leitura.avaliadas[0].carta, ramo, ordemCategorias);
}

type RamoAbertura = 'já cumpriu' | 'urgência alta' | 'precisa sem urgência alta';

function definirRamoAbertura(necessidade: number, urgenciaAlta: boolean): RamoAbertura {
  if (necessidade <= 0) return 'já cumpriu';
  if (urgenciaAlta) return 'urgência alta';
  return 'precisa sem urgência alta';
}

function definirOrdemCategorias(ramo: RamoAbertura): readonly CategoriaCarta[] {
  if (ramo === 'urgência alta') return ['alta', 'média', 'segura', 'baixa', 'garantida_agora'];
  return ['baixa', 'média', 'alta', 'segura', 'garantida_agora'];
}

function criarDecisaoAbertura(
  carta: Carta,
  ramo: RamoAbertura,
  ordemCategorias: readonly CategoriaCarta[],
): DecisaoAberturaLinhaFria {
  return {
    carta,
    motivo: `abertura: ${ramo}; ordem ${ordemCategorias.join('-')}`,
    caminho: criarCaminhoJogadaDebug('abre', 'fria', ramo),
  };
}
