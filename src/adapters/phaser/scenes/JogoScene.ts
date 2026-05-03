import { Scene } from 'phaser';
import { criarBaralho, distribuir, embaralhar } from '@/core/Baralho';
import type { Carta } from '@/core/Carta';
import type { Jogador } from '@/types/entidades';
import type { MaoJogador } from '@/types/estado-partida';
import { DecisorHumano } from '../DecisorHumano';
import { criarDebounceResize, type ResizeDebouncer } from '../redimensionamento';
import { destacarCarta, destruirDestaque, removerDestaque, type EstadoDestaque } from '../renderers/destaque-renderer';
import { renderizarLabel, renderizarMao } from '../renderers/mao-renderer';
import { renderizarMesa } from '../renderers/mesa-renderer';
import { calcularPosicoes } from '../renderers/posicoes-mao';

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

export class JogoScene extends Scene {
  private objetos: Phaser.GameObjects.GameObject[] = [];
  private maos?: MaoJogador[];
  private redesenhar?: ResizeDebouncer;
  private decisor = new DecisorHumano();
  private mesa: Carta[] = [];
  private mesaObjetos: Phaser.GameObjects.GameObject[] = [];
  private destaque: EstadoDestaque = {};

  constructor() {
    super({ key: 'JogoScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#1a1a2e');
    this.maos = this.montarMaos();
    this.desenharMaos(this.maos);
    this.iniciarInteracao();
    this.redesenhar = criarDebounceResize(this, this.redesenharMaos);
    this.scale.on('resize', this.redesenhar);
    this.events.once('shutdown', this.aoEncerrar);
  }

  private iniciarInteracao(): void {
    if (!this.maos) return;
    const maoHumano = this.maos[0].cartas;
    if (maoHumano.length === 0) return;
    this.decisor
      .decidirJogada(maoHumano, {})
      .then((carta) => {
        this.aoJogarCarta(carta);
        this.iniciarInteracao();
      })
      .catch((erro: unknown) => {
        console.error('Falha ao processar jogada humana', erro);
      });
  }

  private aoJogarCarta(carta: Carta): void {
    this.mesa.push(carta);
    if (this.maos) {
      this.maos[0].cartas = this.maos[0].cartas.filter((c) => c !== carta);
    }
    this.redesenharMaos();
  }

  private montarMaos(): MaoJogador[] {
    const cartas = distribuir(embaralhar(criarBaralho()), 4, 4);
    return JOGADORES.map((jogador, i) => ({
      jogador,
      cartas: cartas[i],
      visivel: jogador.id === 'humano',
    }));
  }

  private redesenharMaos = (): void => {
    destruirDestaque(this.destaque);
    this.limparObjetos();
    this.limparMesa();
    if (this.maos) {
      this.desenharMaos(this.maos);
    }
    if (this.mesa.length > 0) {
      renderizarMesa({ cena: this, mesa: this.mesa, objetos: this.mesaObjetos });
    }
  };

  private desenharMaos(maos: MaoJogador[]): void {
    const posicoes = calcularPosicoes({
      largura: this.cameras.main.width,
      altura: this.cameras.main.height,
      margem: MARGEM,
      margemInferior: MARGEM_INFERIOR,
      espacamentoCartas: ESPACAMENTO_CARTAS,
      alturaCarta: ALTURA_CARTA,
    });
    maos.forEach((mao, i) => {
      const p = posicoes[i];
      const label = renderizarLabel({ cena: this, x: p.labelX, y: p.labelY, texto: mao.jogador.nome });
      label.setDepth(10);
      this.objetos.push(label);
      const objetosMao = renderizarMao({ cena: this, posicao: p.mao, cartas: mao.cartas, visivel: mao.visivel });
      this.objetos.push(...objetosMao);

      if (mao.jogador.id === 'humano') {
        this.configurarInteracaoHumano(objetosMao, mao.cartas);
      }
    });

    this.criarFundoInterativo();
  }

  private criarFundoInterativo(): void {
    const { width: largura, height: altura } = this.cameras.main;
    const fundo = this.add
      .rectangle(largura / 2, altura / 2, largura, altura, 0x000000, 0)
      .setInteractive()
      .setDepth(-100);
    this.objetos.push(fundo);
    fundo.on('pointerdown', () => {
      this.aoClicarFundo();
    });
  }

  private configurarInteracaoHumano(objetosMao: Phaser.GameObjects.GameObject[], cartas: Carta[]): void {
    objetosMao.forEach((objeto, j) => {
      const container = objeto as Phaser.GameObjects.Container;
      container.setInteractive();
      const carta = cartas[j];
      container.setData('carta', carta);
      container.on('pointerdown', () => {
        this.aoClicarCarta(container, carta);
      });
    });
  }

  private aoClicarCarta(container: Phaser.GameObjects.Container, carta: Carta): void {
    if (this.destaque.container === container) {
      this.decisor.confirmar();
      return;
    }
    this.decisor.selecionar(carta);
    destacarCarta(this, container, this.destaque);
  }

  private aoClicarFundo(): void {
    this.decisor.desmarcar();
    removerDestaque(this.destaque);
  }

  private aoEncerrar = (): void => {
    if (this.redesenhar) {
      this.scale.off('resize', this.redesenhar);
      this.redesenhar.limpar();
      this.redesenhar = undefined;
    }
    this.limparObjetos();
    this.limparMesa();
    destruirDestaque(this.destaque);
  };

  private limparObjetos(): void {
    this.objetos.forEach((o) => {
      o.destroy();
    });
    this.objetos = [];
  }

  private limparMesa(): void {
    this.mesaObjetos.forEach((o) => {
      o.destroy();
    });
    this.mesaObjetos = [];
  }
}
