import { Scene } from 'phaser';
import { carregarRanking, type RankingPersistido } from '@/store/ranking/carregar-ranking';
import { escalar, escalarFonte } from '../escala';
import { criarDebounceResize, type ResizeDebouncer } from '../redimensionamento';

const COR_FUNDO = 0x1a1a2e;
const COR_TITULO = '#e8ecf5';
const COR_DIM = '#8b95ad';
const COR_BOTAO_FUNDO = 0x111827;
const COR_BORDA = 0x2a3550;

/**
 * Tela cheia do Ranking, aberta sobre a JogoScene (que fica pausada).
 *
 * Nesta fatia (#244) só renderiza o estado vazio. O snapshot é lido pela
 * boundary estrita `carregarRanking`, mas, enquanto o pódio/tabela não
 * existem, qualquer ranking (inclusive populado) é exibido como vazio — sem
 * uma tela só com título/fechar. O caso populado entra a partir do #245.
 */
export class RankingScene extends Scene {
  private objetos: Phaser.GameObjects.GameObject[] = [];
  private redesenhar?: ResizeDebouncer;

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
      // #245: renderizar pódio + tabela a partir de `ranking.participantes`.
      // Até lá, qualquer snapshot cai no estado vazio.
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
