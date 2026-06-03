import type { Scene } from 'phaser';
import type { ResumoTrofeus } from '@/store/trofeus/resumo-trofeus';
import { ROTULO_NIVEL } from '@/store/trofeus/tabela-trofeus';
import { escalarFonte } from '../escala';
import type { LayoutRanking } from './layout-ranking';

const COR_TEXTO = '#e8ecf5';
const COR_ACENTO = '#facc15';

export function desenharTrofeusRanking(
  cena: Scene,
  resumo: ResumoTrofeus | null,
  layout: LayoutRanking,
): Phaser.GameObjects.GameObject[] {
  if (resumo === null) return [];
  const texto = cena.add
    .text(cena.cameras.main.centerX, layout.resumoTrofeus.y, formatarResumo(resumo), {
      fontSize: escalarFonte(12, cena),
      color: COR_TEXTO,
      fontStyle: 'bold',
      fontFamily: 'Arial',
      align: 'center',
    })
    .setOrigin(0.5, 0)
    .setWordWrapWidth(layout.faixa.largura);
  texto.setShadow(0, 0, COR_ACENTO, 2);
  return [texto];
}

function formatarResumo(resumo: ResumoTrofeus): string {
  return `${ROTULO_NIVEL[resumo.maiorTrofeu]} · 🔥 ${String(resumo.sequenciaAtual)} seguidas`;
}
