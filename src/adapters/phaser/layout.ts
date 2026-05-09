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

const PROPORCAO_PAINEL = 0.18;

export function calcularLayout(larguraTela: number, alturaTela: number): LayoutPainel {
  const orientacao = larguraTela >= alturaTela ? 'paisagem' : 'retrato';

  if (orientacao === 'paisagem') {
    const painelLargura = Math.round(larguraTela * PROPORCAO_PAINEL);
    return {
      orientacao,
      infoArea: { x: 0, y: 0, largura: painelLargura, altura: alturaTela },
      gameArea: {
        x: painelLargura,
        y: 0,
        largura: larguraTela - painelLargura,
        altura: alturaTela,
      },
    };
  }

  const painelAltura = Math.round(alturaTela * PROPORCAO_PAINEL);
  return {
    orientacao,
    infoArea: { x: 0, y: 0, largura: larguraTela, altura: painelAltura },
    gameArea: {
      x: 0,
      y: painelAltura,
      largura: larguraTela,
      altura: alturaTela - painelAltura,
    },
  };
}
