export interface Retangulo {
  x: number;
  y: number;
  largura: number;
  altura: number;
}

export type Orientacao = 'paisagem' | 'retrato';

export interface LayoutPainel {
  orientacao: Orientacao;
  infoArea: Retangulo;
  gameArea: Retangulo;
}

/**
 * Tamanhos mínimos (em px físicos) para o painel não espremer seu conteúdo:
 * `largura` garante, em paisagem, espaço para o cabeçalho (🏆 + ? + "Rodada N");
 * `altura` garante, em retrato, que a tabela inteira caiba.
 */
export interface MinimosPainel {
  largura?: number;
  altura?: number;
}

const PROPORCAO_PAINEL = 0.18;

/** Mantém o painel entre o mínimo pedido e metade da tela, sem nunca zerar a gameArea. */
function dimensionarPainel(base: number, minimo: number, total: number): number {
  return Math.min(Math.max(base, minimo), Math.floor(total / 2));
}

export function calcularLayout(larguraTela: number, alturaTela: number, minimos: MinimosPainel = {}): LayoutPainel {
  if (larguraTela >= alturaTela) return layoutPaisagem(larguraTela, alturaTela, minimos.largura ?? 0);
  return layoutRetrato(larguraTela, alturaTela, minimos.altura ?? 0);
}

function layoutPaisagem(larguraTela: number, alturaTela: number, larguraMinima: number): LayoutPainel {
  const painel = dimensionarPainel(Math.round(larguraTela * PROPORCAO_PAINEL), larguraMinima, larguraTela);
  return {
    orientacao: 'paisagem',
    infoArea: { x: 0, y: 0, largura: painel, altura: alturaTela },
    gameArea: { x: painel, y: 0, largura: larguraTela - painel, altura: alturaTela },
  };
}

function layoutRetrato(larguraTela: number, alturaTela: number, alturaMinima: number): LayoutPainel {
  const painel = dimensionarPainel(Math.round(alturaTela * PROPORCAO_PAINEL), alturaMinima, alturaTela);
  return {
    orientacao: 'retrato',
    infoArea: { x: 0, y: 0, largura: larguraTela, altura: painel },
    gameArea: { x: 0, y: painel, largura: larguraTela, altura: alturaTela - painel },
  };
}
