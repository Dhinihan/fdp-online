import type { Scene } from 'phaser';
import type { ResumoTrofeus } from '@/store/trofeus/resumo-trofeus';
import { desenharTrofeuArte, ehPedra } from '../desenhar-trofeu-arte';
import { escalar, escalarFonte } from '../escala';
import type { LayoutRanking } from './layout-ranking';

const COR_TEXTO = '#e8ecf5';
const COR_ACENTO = '#facc15';

export interface OpcoesTrofeusRanking {
  resumo: ResumoTrofeus | null;
  layout: LayoutRanking;
  aoTocar: () => void;
}

/**
 * Linha-resumo dos Troféus no topo do Ranking: a arte do `maiorTrofeu` seguida
 * da Sequência de Vitórias atual, centradas como um grupo. Uma zona interativa
 * cobre o grupo inteiro para abrir o overlay dos sete níveis.
 *
 * Aqui a pedra aparece como só o cristal (sem a taça); o troféu inteiro só é
 * desenhado para os metais (Bronze, Prata, Ouro).
 */
export function desenharTrofeusRanking(
  cena: Scene,
  { resumo, layout, aoTocar }: OpcoesTrofeusRanking,
): Phaser.GameObjects.GameObject[] {
  if (resumo === null) return [];
  const tamanho = escalar(20, cena);
  const gap = escalar(6, cena);
  const centerY = layout.resumoTrofeus.y + tamanho / 2;
  const texto = criarTexto(cena, resumo, centerY);
  const larguraTotal = tamanho + gap + texto.width;
  const inicioX = cena.cameras.main.centerX - larguraTotal / 2;
  texto.setX(inicioX + tamanho + gap);
  const trofeu = desenharTrofeuArte(cena, {
    x: inicioX + tamanho / 2,
    y: centerY,
    tamanho,
    nivel: resumo.maiorTrofeu,
    apenasGema: ehPedra(resumo.maiorTrofeu),
  });
  const zona = criarZona(cena, { inicioX, centerY, larguraTotal, tamanho }, aoTocar);
  return [trofeu, texto, zona];
}

function criarTexto(cena: Scene, resumo: ResumoTrofeus, centerY: number): Phaser.GameObjects.Text {
  const texto = cena.add
    .text(0, centerY, `🔥 ${String(resumo.sequenciaAtual)} seguidas`, {
      fontSize: escalarFonte(12, cena),
      color: COR_TEXTO,
      fontStyle: 'bold',
      fontFamily: 'Arial',
    })
    .setOrigin(0, 0.5);
  texto.setShadow(0, 0, COR_ACENTO, 2);
  return texto;
}

interface GeoZona {
  inicioX: number;
  centerY: number;
  larguraTotal: number;
  tamanho: number;
}

function criarZona(cena: Scene, geo: GeoZona, aoTocar: () => void): Phaser.GameObjects.Zone {
  const zona = cena.add
    .zone(geo.inicioX, geo.centerY, geo.larguraTotal, geo.tamanho)
    .setOrigin(0, 0.5)
    .setInteractive({ useHandCursor: true });
  zona.on('pointerdown', aoTocar);
  return zona;
}
