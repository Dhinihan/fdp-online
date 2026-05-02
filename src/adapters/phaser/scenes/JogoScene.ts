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

const MARGEM = 60;
const MARGEM_INFERIOR = 80;
const ESPACAMENTO_CARTAS = 40;
const ALTURA_CARTA = 75;
const GAP_LABEL = 20;

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
    this.events.once('shutdown', this.aoEncerrar);
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
    const posicoes = this.posicoes();
    maos.forEach((mao, i) => {
      const p = posicoes[i];
      const label = renderizarLabel({ cena: this, x: p.labelX, y: p.labelY, texto: mao.jogador.nome });
      label.setDepth(10);
      this.objetos.push(label);
      this.objetos.push(...renderizarMao({ cena: this, posicao: p.mao, cartas: mao.cartas, visivel: mao.visivel }));
    });
  }

  private posicoes(): PosicaoTela[] {
    const largura = this.cameras.main.width;
    const altura = this.cameras.main.height;
    const cx = largura / 2;
    const cy = altura / 2;
    return [
      {
        labelX: cx,
        labelY: altura - MARGEM_INFERIOR - ALTURA_CARTA - GAP_LABEL,
        mao: { x: cx - 60, y: altura - MARGEM_INFERIOR, espacamento: ESPACAMENTO_CARTAS, direcao: 'horizontal' },
      },
      {
        labelX: MARGEM,
        labelY: cy - ALTURA_CARTA - GAP_LABEL,
        mao: { x: MARGEM, y: cy - 60, espacamento: ESPACAMENTO_CARTAS, direcao: 'vertical' },
      },
      {
        labelX: cx,
        labelY: MARGEM + ALTURA_CARTA + GAP_LABEL,
        mao: { x: cx - 60, y: MARGEM, espacamento: ESPACAMENTO_CARTAS, direcao: 'horizontal' },
      },
      {
        labelX: largura - MARGEM,
        labelY: cy - ALTURA_CARTA - GAP_LABEL,
        mao: { x: largura - MARGEM, y: cy - 60, espacamento: ESPACAMENTO_CARTAS, direcao: 'vertical' },
      },
    ];
  }

  private aoEncerrar = (): void => {
    if (this.redesenhar) {
      this.scale.off('resize', this.redesenhar);
      this.redesenhar.limpar();
      this.redesenhar = undefined;
    }
    this.limparObjetos();
  };

  private limparObjetos(): void {
    this.objetos.forEach((o) => {
      o.destroy();
    });
    this.objetos = [];
  }
}
