import { avaliarCartas, type CategoriaCarta } from '@/core/avaliador-carta';
import type { Carta } from '@/core/Carta';
import type { EstadoEmJogo } from '@/types/estado-rodada';
import { criarCaminhoJogadaDebug } from './debug-jogada-bot';

export interface DecisaoAberturaLinhaFria {
  carta: Carta;
  motivo: string;
  caminho: string[];
}

export function decidirAberturaLinhaFria(mao: Carta[], estado: EstadoEmJogo): DecisaoAberturaLinhaFria {
  if (mao.length === 0) throw new Error('decidirAbertura: mão vazia');
  const jogadorId = estado.maos[estado.jogadorAtual].jogador.id;
  const necessidade = (estado.declaracoes[jogadorId] ?? 0) - (estado.vazas[jogadorId] ?? 0);
  const urgencia = necessidade / mao.length;
  const urgenciaAlta = urgencia >= 0.66;
  const ramo = definirRamoAbertura(necessidade, urgenciaAlta);
  const ordemCategorias = definirOrdemCategorias(ramo);

  const avaliadas = avaliarCartas(mao, estado.manilha, estado.cartasReveladas, estado.maos.length);

  for (const cat of ordemCategorias) {
    const daCategoria = avaliadas.filter((a) => a.categoria === cat);
    if (daCategoria.length > 0) {
      return criarDecisaoAbertura([...daCategoria].sort((a, b) => a.score - b.score)[0].carta, ramo, ordemCategorias);
    }
  }

  return criarDecisaoAbertura(mao[0], ramo, ordemCategorias);
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
