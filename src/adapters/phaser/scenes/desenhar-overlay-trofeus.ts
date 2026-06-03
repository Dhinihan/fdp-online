import type { Scene } from 'phaser';
import type { Nivel } from '@/store/trofeus/tabela-trofeus';
import { NIVEIS_ORDENADOS, ROTULO_NIVEL } from '@/store/trofeus/tabela-trofeus';
import { escalar, escalarFonte } from '../escala';

const COR_BACKDROP = 0x0b0f1a;
const COR_PAINEL = 0x1f2740;
const COR_BORDA = 0x2a3550;
const COR_TITULO = '#e8ecf5';
const COR_DICA = '#8b95ad';
const COR_CONQUISTADO = '#facc15';
const COR_BLOQUEADO = '#4b5572';

const PASSO_NIVEL = 40;
const PAD_TOPO = 76;
const PAD_BASE = 24;

interface ContextoOverlay {
  cena: Scene;
  x: number;
  xEsquerda: number;
  topo: number;
}

/**
 * Overlay tocável da coleção de Troféus, aberto sobre o Ranking. Mostra os sete
 * níveis na ordem da tabela: os conquistados (até o `maiorTrofeu`, inclusive)
 * acesos; os bloqueados, apagados. Tocar fora do painel (ou no botão ×) fecha;
 * o painel absorve o toque para não fechar por engano. O overlay é transitório
 * e não deixa resíduo no layout do Ranking.
 */
export function desenharOverlayTrofeus(
  cena: Scene,
  maiorTrofeu: Nivel,
  aoFechar: () => void,
): Phaser.GameObjects.GameObject[] {
  const { centerX, centerY, width, height } = cena.cameras.main;
  const largura = Math.min(width - escalar(48, cena), escalar(340, cena));
  const altura = escalar(PAD_TOPO + PAD_BASE, cena) + escalar(PASSO_NIVEL, cena) * NIVEIS_ORDENADOS.length;
  const topo = centerY - altura / 2;
  const ctx: ContextoOverlay = { cena, x: centerX, xEsquerda: centerX - largura / 2 + escalar(48, cena), topo };

  const backdrop = cena.add
    .rectangle(centerX, centerY, width, height, COR_BACKDROP, 0.82)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', aoFechar);
  // O painel é interativo só para absorver o toque (topOnly): assim o clique
  // dentro dele não chega ao backdrop e o overlay não fecha por engano.
  const painel = cena.add
    .rectangle(centerX, centerY, largura, altura, COR_PAINEL, 1)
    .setStrokeStyle(escalar(1, cena), COR_BORDA)
    .setInteractive();
  const fechar = desenharBotaoFechar(
    cena,
    { x: centerX + largura / 2 - escalar(24, cena), y: topo + escalar(24, cena) },
    aoFechar,
  );

  return [backdrop, painel, fechar, ...desenharCabecalho(ctx), ...desenharNiveis(ctx, maiorTrofeu)];
}

function desenharBotaoFechar(
  cena: Scene,
  posicao: { x: number; y: number },
  aoFechar: () => void,
): Phaser.GameObjects.GameObject {
  const botao = cena.add
    .text(posicao.x, posicao.y, '×', { fontSize: escalarFonte(24, cena), color: COR_DICA, fontFamily: 'Arial' })
    .setOrigin(0.5);
  botao.setInteractive({ useHandCursor: true }).on('pointerdown', aoFechar);
  return botao;
}

function desenharCabecalho({ cena, x, topo }: ContextoOverlay): Phaser.GameObjects.GameObject[] {
  const titulo = cena.add
    .text(x, topo + escalar(28, cena), 'Coleção de Troféus', {
      fontSize: escalarFonte(16, cena),
      color: COR_TITULO,
      fontStyle: 'bold',
      fontFamily: 'Arial',
    })
    .setOrigin(0.5);
  const dica = cena.add
    .text(x, topo + escalar(50, cena), 'Toque fora para fechar', {
      fontSize: escalarFonte(11, cena),
      color: COR_DICA,
      fontFamily: 'Arial',
    })
    .setOrigin(0.5);
  return [titulo, dica];
}

function desenharNiveis(ctx: ContextoOverlay, maiorTrofeu: Nivel): Phaser.GameObjects.GameObject[] {
  const { cena, xEsquerda, topo } = ctx;
  const maxIndice = NIVEIS_ORDENADOS.indexOf(maiorTrofeu);
  const baseY = topo + escalar(PAD_TOPO, cena);
  return NIVEIS_ORDENADOS.map((nivel, indice) => {
    const y = baseY + escalar(PASSO_NIVEL, cena) * indice;
    return desenharNivel(cena, { nivel, conquistado: indice <= maxIndice, x: xEsquerda, y });
  });
}

interface ContextoNivel {
  nivel: Nivel;
  conquistado: boolean;
  x: number;
  y: number;
}

function desenharNivel(cena: Scene, { nivel, conquistado, x, y }: ContextoNivel): Phaser.GameObjects.GameObject {
  const marca = conquistado ? '🏆' : '🔒';
  return cena.add
    .text(x, y, `${marca}  ${ROTULO_NIVEL[nivel]}`, {
      fontSize: escalarFonte(14, cena),
      color: conquistado ? COR_CONQUISTADO : COR_BLOQUEADO,
      fontStyle: conquistado ? 'bold' : 'normal',
      fontFamily: 'Arial',
    })
    .setOrigin(0, 0.5)
    .setAlpha(conquistado ? 1 : 0.5);
}
