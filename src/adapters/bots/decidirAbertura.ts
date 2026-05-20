import { avaliarCartas } from '@/core/avaliador-carta';
import type { Carta } from '@/core/Carta';
import type { EstadoEmJogo } from '@/types/estado-rodada';

interface ParametrosAbertura {
  temperatura: number;
  urgenciaAbrirForte?: number;
}

export function decidirAbertura(mao: Carta[], estado: EstadoEmJogo, params: ParametrosAbertura): Carta {
  if (mao.length === 0) throw new Error('decidirAbertura: mão vazia');
  const jogadorId = estado.maos[estado.jogadorAtual].jogador.id;
  const necessidade = (estado.declaracoes[jogadorId] ?? 0) - (estado.vazas[jogadorId] ?? 0);
  // Garante folga >= 0 para evitar denominadores negativos ou divisão por zero.
  // Em caso de déficit extremo (necessidade > tamanho da mão), a folga fica em 0,
  // mantendo a urgência positiva alta para forçar o bot a jogar agressivamente.
  const folga = Math.max(0, mao.length - necessidade);
  const urgencia = necessidade / (folga + 1);

  const urgenciaAbrirForte = params.urgenciaAbrirForte ?? 0.5;
  const limiarAjustado = urgenciaAbrirForte + params.temperatura;
  const quebraCautela = urgencia >= limiarAjustado;

  const avaliadas = avaliarCartas(mao, estado.manilha, estado.cartasReveladas, estado.maos.length);

  const ordemCategorias = quebraCautela
    ? (['alta', 'média', 'segura', 'baixa', 'garantida_agora'] as const)
    : (['baixa', 'média', 'alta', 'segura', 'garantida_agora'] as const);

  for (const cat of ordemCategorias) {
    const daCategoria = avaliadas.filter((a) => a.categoria === cat);
    if (daCategoria.length > 0) {
      return [...daCategoria].sort((a, b) => a.score - b.score)[0].carta;
    }
  }

  // Fallback defensivo caso nenhuma categoria seja encontrada (inalcançável teoricamente)
  return mao[0];
}
