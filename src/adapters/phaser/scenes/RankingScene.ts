import { Scene } from 'phaser';
import { carregarRanking, type RankingPersistido } from '@/store/ranking/carregar-ranking';
import type { MetricaRanking } from '@/store/ranking/ordenar-ranking';
import { escalar, escalarFonte } from '../escala';
import { criarDebounceResize, type ResizeDebouncer } from '../redimensionamento';
import { desenharTabelaRanking } from './desenhar-tabela-ranking';

const COR_FUNDO = 0x1a1a2e;
const COR_TITULO = '#e8ecf5';
const COR_DIM = '#8b95ad';
const COR_ACENTO_TEXTO = '#1a1a2e';
const COR_BOTAO_FUNDO = 0x111827;
const COR_BORDA = 0x2a3550;
const COR_SEGMENTO = 0x111827;
const COR_SEGMENTO_ATIVO = 0xfacc15;

const OPCOES_METRICA: { chave: MetricaRanking; rotulo: string }[] = [
  { chave: 'vitorias', rotulo: 'Vitórias' },
  { chave: 'winRate', rotulo: 'Win rate' },
  { chave: 'posMedia', rotulo: 'Pos. média' },
];

interface SegmentoCtx {
  opcao: { chave: MetricaRanking; rotulo: string };
  x: number;
  y: number;
  largura: number;
}

/**
 * Tela cheia do Ranking, aberta sobre a JogoScene (que fica pausada).
 *
 * Lê o snapshot pela boundary estrita `carregarRanking`: ranking vazio mostra a
 * mensagem de tela vazia; ranking populado renderiza a tabela de participantes
 * ordenada pela métrica ativa. O pódio (#247) entra numa fatia posterior.
 */
export class RankingScene extends Scene {
  private objetos: Phaser.GameObjects.GameObject[] = [];
  private redesenhar?: ResizeDebouncer;
  private metricaAtiva: MetricaRanking = 'vitorias';

  constructor() {
    super({ key: 'RankingScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#1a1a2e');
    this.desenhar();
    this.redesenhar = criarDebounceResize(this, () => {
      this.desenhar();
    });
    this.scale.on('resize', this.redesenhar);
    this.events.once('shutdown', () => {
      this.aoEncerrar();
    });
  }

  private desenhar(): void {
    this.limpar();
    const ranking = carregarRanking(window.localStorage);
    this.desenharFundo();
    this.desenharTitulo();
    this.desenharBotaoFechar();
    this.desenharConteudo(ranking);
  }

  private desenharConteudo(ranking: RankingPersistido): void {
    if (ranking.tipo === 'populado') {
      this.desenharControleOrdenacao();
      this.objetos.push(...desenharTabelaRanking(this, ranking.participantes, this.metricaAtiva));
      return;
    }
    this.desenharVazio();
  }

  private desenharFundo(): void {
    const { width, height } = this.cameras.main;
    const fundo = this.add.rectangle(width / 2, height / 2, width, height, COR_FUNDO, 1);
    this.objetos.push(fundo);
  }

  private desenharTitulo(): void {
    const titulo = this.add
      .text(this.cameras.main.centerX, escalar(28, this), 'Ranking', {
        fontSize: escalarFonte(22, this),
        color: COR_TITULO,
        fontStyle: 'bold',
        fontFamily: 'Arial',
      })
      .setOrigin(0.5, 0);
    this.objetos.push(titulo);
  }

  private desenharBotaoFechar(): void {
    const raio = escalar(20, this);
    const x = this.cameras.main.width - escalar(16, this) - raio;
    const y = escalar(16, this) + raio;
    const circulo = this.add.circle(x, y, raio, COR_BOTAO_FUNDO, 1).setStrokeStyle(escalar(1, this), COR_BORDA);
    const x_ = this.add
      .text(x, y, '×', { fontSize: escalarFonte(22, this), color: COR_DIM, fontFamily: 'Arial' })
      .setOrigin(0.5);
    circulo.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
      this.fechar();
    });
    this.objetos.push(circulo, x_);
  }

  private desenharControleOrdenacao(): void {
    const largura = Math.min(this.cameras.main.width - escalar(32, this), escalar(600, this));
    const esquerda = (this.cameras.main.width - largura) / 2;
    const y = escalar(76, this);
    const rotulo = this.add.text(esquerda, y, 'Ordenar por', {
      fontSize: escalarFonte(12, this),
      color: COR_DIM,
      fontFamily: 'Arial',
    });
    const fundo = this.add
      .rectangle(esquerda, y + escalar(34, this), largura, escalar(40, this), COR_SEGMENTO, 1)
      .setOrigin(0, 0.5)
      .setStrokeStyle(escalar(1, this), COR_BORDA);
    this.objetos.push(rotulo, fundo, ...this.desenharSegmentos(esquerda, y + escalar(34, this), largura));
  }

  private desenharSegmentos(x: number, y: number, largura: number): Phaser.GameObjects.GameObject[] {
    const larguraSegmento = largura / OPCOES_METRICA.length;
    return OPCOES_METRICA.flatMap((opcao, indice) => {
      const centroX = x + larguraSegmento * indice + larguraSegmento / 2;
      return this.desenharSegmento({ opcao, x: centroX, y, largura: larguraSegmento });
    });
  }

  private desenharSegmento({ opcao, x, y, largura }: SegmentoCtx): Phaser.GameObjects.GameObject[] {
    const ativo = opcao.chave === this.metricaAtiva;
    const fundo = this.add.rectangle(
      x,
      y,
      largura - escalar(8, this),
      escalar(30, this),
      ativo ? COR_SEGMENTO_ATIVO : 0,
      ativo ? 1 : 0,
    );
    const texto = this.add
      .text(x, y, opcao.rotulo, {
        fontSize: escalarFonte(12, this),
        color: ativo ? COR_ACENTO_TEXTO : COR_DIM,
        fontStyle: 'bold',
        fontFamily: 'Arial',
      })
      .setOrigin(0.5);
    fundo.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
      this.alterarMetrica(opcao.chave);
    });
    texto.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
      this.alterarMetrica(opcao.chave);
    });
    return [fundo, texto];
  }

  private desenharVazio(): void {
    const { centerX, centerY } = this.cameras.main;
    const mensagem = this.add
      .text(centerX, centerY, 'Nenhuma partida concluída', {
        fontSize: escalarFonte(15, this),
        color: COR_DIM,
        fontFamily: 'Arial',
      })
      .setOrigin(0.5);
    this.objetos.push(mensagem);
  }

  private fechar(): void {
    this.scene.stop();
    this.scene.resume('JogoScene');
  }

  private alterarMetrica(metrica: MetricaRanking): void {
    if (this.metricaAtiva === metrica) return;
    this.metricaAtiva = metrica;
    this.desenhar();
  }

  private limpar(): void {
    this.objetos.forEach((obj) => {
      obj.destroy();
    });
    this.objetos = [];
  }

  private aoEncerrar(): void {
    if (this.redesenhar) {
      this.scale.off('resize', this.redesenhar);
      this.redesenhar.limpar();
    }
    this.limpar();
  }
}
