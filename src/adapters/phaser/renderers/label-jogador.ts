import type { Jogador } from '@/types/entidades';

export type DirecaoLabel = 'horizontal' | 'vertical';

export function formatarLabelJogador(nome: string, vazas: number, direcao: DirecaoLabel): string {
  const contador = `(Fez: ${String(vazas)})`;
  return direcao === 'horizontal' ? `${nome} ${contador}` : `${nome}\n${contador}`;
}

export interface ConfigAtualizarLabelVencedor {
  vencedorId: string | undefined;
  jogadores: Jogador[];
  vazas: Record<string, number>;
  labels: Phaser.GameObjects.Text[];
  direcoes: DirecaoLabel[];
}

export function atualizarLabelVencedor(config: ConfigAtualizarLabelVencedor): void {
  const { vencedorId, jogadores, vazas, labels, direcoes } = config;
  if (!vencedorId) return;
  const indice = jogadores.findIndex((j) => j.id === vencedorId);
  if (indice < 0 || indice >= labels.length || indice >= direcoes.length) return;
  const jogador = jogadores[indice];
  const contagem = vazas[jogador.id] ?? 0;
  labels[indice].setText(formatarLabelJogador(jogador.nome, contagem, direcoes[indice]));
}
