import { Scene } from 'phaser';
import { criarBaralho, distribuir } from '@/core/Baralho';
import type { Jogador } from '@/types/entidades';
import type { MaoJogador } from '@/types/estado-partida';
import { criarDebounceResize, type ResizeDebouncer } from '../redimensionamento';
import { renderizarLabel, renderizarMao, type PosicaoMao } from '../renderers/mao-renderer';

const JOGADORES: Jogador[] = [
  { id: 'humano', nome: 'Você', pontos: 5 },
  { id: 'bot1', nome: 'Bot 1', pontos: 5 },
  { id: 'bot2', nome: 'Bot 2', pontos: 5 },
  { id: 'bot3', nome: 'Bot 3', pontos: 5 },
];

interface PosicaoTela {
  labelX: number;
  labelY: number;
  mao: PosicaoMao;
}

export class JogoScene extends Scene {
  private objetos: Phaser.GameObjects.GameObject[] = [];
  private maos?: MaoJogador[];
  private redesenhar?: ResizeDebouncer;

  constructor() {
    super({ key: 'JogoScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#1a1a2e');
    this.maos = this.montarMaos();
    this.desenharMaos(this.maos);
    this.redesenhar = criarDebounceResize(this, this.redesenharMaos);
    this.scale.on('resize', this.redesenhar);
  }

  private montarMaos(): MaoJogador[] {
    const cartas = distribuir(criarBaralho(), 4, 4);
    return JOGADORES.map((jogador, i) => ({
      jogador,
      cartas: cartas[i],
      visivel: jogador.id === 'humano',
    }));
  }

  private redesenharMaos = (): void => {
    this.limparObjetos();
    if (this.maos) {
      this.desenharMaos(this.maos);
    }
  };

  private desenharMaos(maos: MaoJogador[]): void {
    const cx = this.cameras.main.centerX;
    const cy = this.cameras.main.centerY;
    const posicoes = this.posicoes(cx, cy);
    maos.forEach((mao, i) => {
      const p = posicoes[i];
      this.objetos.push(renderizarLabel({ cena: this, x: p.labelX, y: p.labelY, texto: mao.jogador.nome }));
      this.objetos.push(...renderizarMao({ cena: this, posicao: p.mao, cartas: mao.cartas, visivel: mao.visivel }));
    });
  }

  private posicoes(cx: number, cy: number): PosicaoTela[] {
    const d = 130;
    const e = 40;
    return [
      { labelX: cx, labelY: cy + d + 30, mao: { x: cx - 60, y: cy + d, espacamento: e, direcao: 'horizontal' } },
      { labelX: cx - d - 30, labelY: cy - 100, mao: { x: cx - d, y: cy - 60, espacamento: e, direcao: 'vertical' } },
      { labelX: cx, labelY: cy - d - 30, mao: { x: cx - 60, y: cy - d, espacamento: e, direcao: 'horizontal' } },
      { labelX: cx + d + 30, labelY: cy - 100, mao: { x: cx + d, y: cy - 60, espacamento: e, direcao: 'vertical' } },
    ];
  }

  shutdown(): void {
    if (this.redesenhar) {
      this.scale.off('resize', this.redesenhar);
      this.redesenhar.limpar();
      this.redesenhar = undefined;
    }
    this.limparObjetos();
  }

  private limparObjetos(): void {
    this.objetos.forEach((o) => {
      o.destroy();
    });
    this.objetos = [];
  }
}
