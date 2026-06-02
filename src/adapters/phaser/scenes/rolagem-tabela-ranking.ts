import type { Scene } from 'phaser';

/**
 * Rolagem vertical da lista de participantes do Ranking (issue #249).
 *
 * O caso comum (lista curta) cabe na tela e não rola. Quando o roster cresce
 * (1 humano + até 20 Perfis de Bot) as linhas transbordam: elas vão para um
 * `Container` mascarado na região da lista e o controlador move o container no
 * eixo Y por arrasto e roda do mouse, com o deslocamento preso entre 0 e o
 * `offsetMáximo`. Título, fundo, botão de fechar, controles de ordenação e o
 * cabeçalho de colunas ficam fora do container e permanecem fixos.
 *
 * A geometria pura (limites e clamp) fica isolada nas funções abaixo, testáveis
 * sem Phaser; o `ControladorRolagemTabela` apenas as aplica ao container.
 */

export interface RegiaoLista {
  topo: number;
  fundo: number;
}

export interface ConfigRolagemTabela {
  cena: Scene;
  container: Phaser.GameObjects.Container;
  regiao: RegiaoLista;
  offsetMaximo: number;
}

/** Quanto a lista pode rolar: 0 quando o conteúdo cabe na área visível. */
export function offsetMaximoRolagem(alturaConteudo: number, alturaVisivel: number): number {
  return Math.max(0, alturaConteudo - alturaVisivel);
}

/** Há transbordo? Só então vale criar máscara e ligar o arrasto/roda. */
export function precisaRolar(alturaConteudo: number, alturaVisivel: number): boolean {
  return offsetMaximoRolagem(alturaConteudo, alturaVisivel) > 0;
}

/** Prende o deslocamento entre o topo (0) e o fim da lista (offsetMáximo). */
export function clampOffsetRolagem(offset: number, offsetMaximo: number): number {
  return Math.min(offsetMaximo, Math.max(0, offset));
}

export class ControladorRolagemTabela {
  private offset = 0;
  private arrastando = false;
  private ultimoY = 0;
  private readonly cena: Scene;
  private readonly container: Phaser.GameObjects.Container;
  private readonly regiao: RegiaoLista;
  private readonly offsetMaximo: number;
  private readonly aoPressionar: (p: Phaser.Input.Pointer) => void;
  private readonly aoMover: (p: Phaser.Input.Pointer) => void;
  private readonly aoSoltar: () => void;
  private readonly aoRolar: (p: Phaser.Input.Pointer) => void;

  constructor(config: ConfigRolagemTabela) {
    this.cena = config.cena;
    this.container = config.container;
    this.regiao = config.regiao;
    this.offsetMaximo = config.offsetMaximo;
    this.aoPressionar = (p) => {
      this.iniciarArrasto(p);
    };
    this.aoMover = (p) => {
      this.arrastar(p);
    };
    this.aoSoltar = () => {
      this.arrastando = false;
    };
    this.aoRolar = (p) => {
      this.aplicar(this.offset + p.deltaY);
    };
    this.registrar();
  }

  private registrar(): void {
    const input = this.cena.input;
    input.on('pointerdown', this.aoPressionar);
    input.on('pointermove', this.aoMover);
    input.on('pointerup', this.aoSoltar);
    input.on('pointerupoutside', this.aoSoltar);
    input.on('wheel', this.aoRolar);
  }

  private iniciarArrasto(p: Phaser.Input.Pointer): void {
    if (p.y < this.regiao.topo || p.y > this.regiao.fundo) return;
    this.arrastando = true;
    this.ultimoY = p.y;
  }

  private arrastar(p: Phaser.Input.Pointer): void {
    if (!this.arrastando) return;
    this.aplicar(this.offset - (p.y - this.ultimoY));
    this.ultimoY = p.y;
  }

  private aplicar(bruto: number): void {
    this.offset = clampOffsetRolagem(bruto, this.offsetMaximo);
    this.container.y = -this.offset;
  }

  destruir(): void {
    const input = this.cena.input;
    input.off('pointerdown', this.aoPressionar);
    input.off('pointermove', this.aoMover);
    input.off('pointerup', this.aoSoltar);
    input.off('pointerupoutside', this.aoSoltar);
    input.off('wheel', this.aoRolar);
  }
}
