import { Scene } from 'phaser';
import { carregarRanking, type RankingPersistido } from '@/store/ranking/carregar-ranking';
import type { MetricaRanking } from '@/store/ranking/ordenar-ranking';
import { escalar, escalarFonte } from '../escala';
import { criarDebounceResize, type ResizeDebouncer } from '../redimensionamento';
import { desenharPodioRanking } from './desenhar-podio-ranking';
import { desenharTabelaRanking, type TabelaRankingRender } from './desenhar-tabela-ranking';
import { offsetMaximoRolagem, precisaRolar, type GeometriaListaRanking } from './geometria-rolagem-tabela-ranking';
import { calcularLayoutRanking, type LayoutRanking } from './layout-ranking';
import { OPCOES_METRICA_RANKING, prepararRankingRenderModel } from './ranking-view';
import { ControladorRolagemTabela } from './rolagem-tabela-ranking';

const COR_FUNDO = 0x1a1a2e;
const COR_TITULO = '#e8ecf5';
const COR_DIM = '#8b95ad';
const COR_ACENTO_TEXTO = '#1a1a2e';
const COR_BOTAO_FUNDO = 0x111827;
const COR_BORDA = 0x2a3550;
const COR_SEGMENTO = 0x111827;
const COR_SEGMENTO_ATIVO = 0xfacc15;

interface SegmentoCtx {
  opcao: (typeof OPCOES_METRICA_RANKING)[number];
  x: number;
  y: number;
  largura: number;
}

/**
 * Tela cheia do Ranking, aberta sobre a JogoScene (que fica pausada).
 *
 * Lê o snapshot pela boundary estrita `carregarRanking`: ranking vazio mostra a
 * mensagem de tela vazia; ranking populado renderiza pódio e tabela com a
 * mesma ordenação da métrica ativa.
 */
export class RankingScene extends Scene {
  private objetos: Phaser.GameObjects.GameObject[] = [];
  private redesenhar?: ResizeDebouncer;
  private rolagem?: ControladorRolagemTabela;
  private metricaAtiva: MetricaRanking = 'vitorias';

  constructor() {
    super({ key: 'RankingScene' });
  }

  create(): void {
    this.metricaAtiva = 'vitorias';
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
      const layout = calcularLayoutRanking(this);
      const model = prepararRankingRenderModel(ranking.participantes, this.metricaAtiva);
      this.objetos.push(...desenharPodioRanking(this, model, layout));
      this.desenharControleOrdenacao(layout);
      this.desenharTabelaComRolagem(desenharTabelaRanking(this, model, layout));
      return;
    }
    this.desenharVazio();
  }

  private desenharTabelaComRolagem(tabela: TabelaRankingRender): void {
    this.objetos.push(...tabela.cabecalho);
    const { regiao, alturaConteudo, alturaVisivel } = tabela.geometria;
    if (!precisaRolar(alturaConteudo, alturaVisivel)) {
      this.objetos.push(...tabela.linhas);
      return;
    }
    const container = this.add.container(0, 0, tabela.linhas);
    container.setMask(this.criarMascaraLista(tabela.geometria));
    this.objetos.push(container);
    this.rolagem = new ControladorRolagemTabela({
      cena: this,
      container,
      regiao,
      offsetMaximo: offsetMaximoRolagem(alturaConteudo, alturaVisivel),
    });
  }

  private criarMascaraLista({ regiao, alturaVisivel }: GeometriaListaRanking): Phaser.Display.Masks.GeometryMask {
    const forma = this.add
      .graphics()
      .fillStyle(0xffffff, 1)
      .fillRect(regiao.esquerda, regiao.topo, regiao.direita - regiao.esquerda, alturaVisivel)
      .setVisible(false);
    this.objetos.push(forma);
    return forma.createGeometryMask();
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

  private desenharControleOrdenacao(layout: LayoutRanking): void {
    const { esquerda, largura } = layout.faixa;
    const y = layout.controle.yRotulo;
    const rotulo = this.add.text(esquerda, y, 'Ordenar por', {
      fontSize: escalarFonte(12, this),
      color: COR_DIM,
      fontFamily: 'Arial',
    });
    const fundo = this.add
      .rectangle(esquerda, layout.controle.ySegmentos, largura, layout.controle.altura, COR_SEGMENTO, 1)
      .setOrigin(0, 0.5)
      .setStrokeStyle(escalar(1, this), COR_BORDA);
    this.objetos.push(rotulo, fundo, ...this.desenharSegmentos(esquerda, layout.controle.ySegmentos, largura));
  }

  private desenharSegmentos(x: number, y: number, largura: number): Phaser.GameObjects.GameObject[] {
    const larguraSegmento = largura / OPCOES_METRICA_RANKING.length;
    return OPCOES_METRICA_RANKING.flatMap((opcao, indice) => {
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
    this.rolagem?.destruir();
    this.rolagem = undefined;
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
