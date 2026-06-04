import type { Scene } from 'phaser';
import type { Nivel } from '@/store/trofeus/tabela-trofeus';
import { NIVEIS_ORDENADOS, ROTULO_NIVEL } from '@/store/trofeus/tabela-trofeus';
import { corDoNivel, desenharTrofeuArte } from '../desenhar-trofeu-arte';
import { escalar, escalarFonte } from '../escala';

const COR_BACKDROP = 0x0b0f1a;
const COR_PAINEL = 0x1f2740;
const COR_BORDA = 0x2a3550;
const COR_TITULO = '#e8ecf5';
const COR_DICA = '#8b95ad';
const COR_BLOQUEADO = '#4b5572';

/** Nível-porta: as gemas só aparecem no painel depois de conquistar o Ouro. */
const NIVEL_PORTA: Nivel = 'ouro';

/**
 * Níveis a exibir no painel: sempre os metais; as gemas só entram quando o
 * `maiorTrofeu` já alcançou o Ouro. Antes disso o painel encolhe e se comporta
 * como se as gemas não existissem.
 */
function niveisVisiveis(maiorTrofeu: Nivel): readonly Nivel[] {
  const conquistouOuro = NIVEIS_ORDENADOS.indexOf(maiorTrofeu) >= NIVEIS_ORDENADOS.indexOf(NIVEL_PORTA);
  return conquistouOuro ? NIVEIS_ORDENADOS : NIVEIS_ORDENADOS.slice(0, NIVEIS_ORDENADOS.indexOf(NIVEL_PORTA) + 1);
}

/** Converte cor numérica (`0xrrggbb`) na string `#rrggbb` que o texto exige. */
function paraHex(cor: number): string {
  return `#${cor.toString(16).padStart(6, '0')}`;
}

const PASSO_NIVEL = 40;
const PAD_TOPO = 76;
const PAD_BASE = 24;
const MARGEM_VERTICAL = 16;

interface LayoutOverlay {
  cena: Scene;
  centerX: number;
  centerY: number;
  largura: number;
  altura: number;
  topo: number;
  xEsquerda: number;
  fator: number;
}

/**
 * Geometria do overlay. A altura natural cabe os sete níveis com folga, mas é
 * limitada à altura da câmera (menos a margem); quando não cabe, `fator` < 1
 * compacta espaçamentos e fontes para o painel nunca sair da viewport — daí
 * `topo >= margem` é garantido. Espelha o `escalaConteudo` do fim de jogo.
 */
function calcularLayout(cena: Scene, totalNiveis: number): LayoutOverlay {
  const { centerX, centerY, width, height } = cena.cameras.main;
  const largura = Math.min(width - escalar(48, cena), escalar(340, cena));
  const alturaNatural = escalar(PAD_TOPO + PAD_BASE, cena) + escalar(PASSO_NIVEL, cena) * totalNiveis;
  const altura = Math.min(alturaNatural, height - escalar(MARGEM_VERTICAL, cena) * 2);
  return {
    cena,
    centerX,
    centerY,
    largura,
    altura,
    topo: centerY - altura / 2,
    xEsquerda: centerX - largura / 2 + escalar(48, cena),
    fator: altura / alturaNatural,
  };
}

/**
 * Overlay tocável da coleção de Troféus, aberto sobre o Ranking. Mostra os sete
 * níveis na ordem da tabela: os conquistados (até o `maiorTrofeu`, inclusive)
 * acesos; os bloqueados, apagados (mesmo troféu, esmaecido). Tocar fora do
 * painel (ou no botão ×) fecha; o painel absorve o toque para não fechar por
 * engano. O overlay é transitório e não deixa resíduo no layout do Ranking.
 */
export function desenharOverlayTrofeus(
  cena: Scene,
  maiorTrofeu: Nivel,
  aoFechar: () => void,
): Phaser.GameObjects.GameObject[] {
  const niveis = niveisVisiveis(maiorTrofeu);
  const layout = calcularLayout(cena, niveis.length);
  const { centerX, centerY, largura, altura } = layout;
  const { width, height } = cena.cameras.main;

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
  const fechar = desenharBotaoFechar(layout, aoFechar);

  return [backdrop, painel, fechar, ...desenharCabecalho(layout), ...desenharNiveis(layout, niveis, maiorTrofeu)];
}

function desenharBotaoFechar(layout: LayoutOverlay, aoFechar: () => void): Phaser.GameObjects.GameObject {
  const { cena, centerX, largura, topo, fator } = layout;
  const botao = cena.add
    .text(centerX + largura / 2 - escalar(24, cena), topo + escalar(24 * fator, cena), '×', {
      fontSize: escalarFonte(24 * fator, cena),
      color: COR_DICA,
      fontFamily: 'Arial',
    })
    .setOrigin(0.5);
  botao.setInteractive({ useHandCursor: true }).on('pointerdown', aoFechar);
  return botao;
}

function desenharCabecalho({ cena, centerX, topo, fator }: LayoutOverlay): Phaser.GameObjects.GameObject[] {
  const titulo = cena.add
    .text(centerX, topo + escalar(28 * fator, cena), 'Coleção de Troféus', {
      fontSize: escalarFonte(16 * fator, cena),
      color: COR_TITULO,
      fontStyle: 'bold',
      fontFamily: 'Arial',
    })
    .setOrigin(0.5);
  return [titulo];
}

function desenharNiveis(
  layout: LayoutOverlay,
  niveis: readonly Nivel[],
  maiorTrofeu: Nivel,
): Phaser.GameObjects.GameObject[] {
  const { cena, xEsquerda, topo, fator } = layout;
  const maxIndice = NIVEIS_ORDENADOS.indexOf(maiorTrofeu);
  const baseY = topo + escalar(PAD_TOPO * fator, cena);
  return niveis.flatMap((nivel, indice) => {
    const y = baseY + escalar(PASSO_NIVEL * fator, cena) * indice;
    const conquistado = NIVEIS_ORDENADOS.indexOf(nivel) <= maxIndice;
    return desenharNivel(cena, { nivel, conquistado, x: xEsquerda, y, fator });
  });
}

interface ContextoNivel {
  nivel: Nivel;
  conquistado: boolean;
  x: number;
  y: number;
  fator: number;
}

function desenharNivel(
  cena: Scene,
  { nivel, conquistado, x, y, fator }: ContextoNivel,
): Phaser.GameObjects.GameObject[] {
  const tamanho = escalar(28 * fator, cena);
  const trofeu = desenharTrofeuArte(cena, { x: x + tamanho / 2, y, tamanho, nivel, aceso: conquistado });
  const rotulo = cena.add
    .text(x + tamanho + escalar(12, cena), y, ROTULO_NIVEL[nivel], {
      fontSize: escalarFonte(14 * fator, cena),
      color: conquistado ? paraHex(corDoNivel(nivel)) : COR_BLOQUEADO,
      fontStyle: conquistado ? 'bold' : 'normal',
      fontFamily: 'Arial',
    })
    .setOrigin(0, 0.5)
    .setAlpha(conquistado ? 1 : 0.5);
  return [trofeu, rotulo];
}
