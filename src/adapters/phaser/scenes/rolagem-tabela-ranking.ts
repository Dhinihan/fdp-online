import type { Scene } from 'phaser';
import { clampOffsetRolagem, contemPonteiroNaRegiao, type RegiaoLista } from './geometria-rolagem-tabela-ranking';

/**
 * Controlador Phaser da rolagem da lista do Ranking (issue #249).
 *
 * Quando o roster transborda (1 humano + até 20 Perfis de Bot), as linhas vão
 * para um `Container` mascarado e este controlador as move no eixo Y por
 * arrasto e roda do mouse, com o deslocamento preso entre 0 e o `offsetMáximo`.
 * Arrasto e roda só agem quando o ponteiro está dentro do corpo da tabela — a
 * mesma `RegiaoLista`, o mesmo hit-test — para não roubar input de título,
 * cabeçalho, controles de ordenação e botão de fechar, que ficam fixos.
 *
 * A geometria (limites, clamp, hit-test) vive em
 * `geometria-rolagem-tabela-ranking.ts`, pura e testável; aqui só há Phaser.
 */

export interface ConfigRolagemTabela {
  cena: Scene;
  container: Phaser.GameObjects.Container;
  regiao: RegiaoLista;
  offsetMaximo: number;
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
      this.rolarComRoda(p);
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
    if (!contemPonteiroNaRegiao(this.regiao, p)) return;
    this.arrastando = true;
    this.ultimoY = p.y;
  }

  private arrastar(p: Phaser.Input.Pointer): void {
    if (!this.arrastando) return;
    this.aplicar(this.offset - (p.y - this.ultimoY));
    this.ultimoY = p.y;
  }

  private rolarComRoda(p: Phaser.Input.Pointer): void {
    if (!contemPonteiroNaRegiao(this.regiao, p)) return;
    this.aplicar(this.offset + p.deltaY);
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
