import { Scene } from 'phaser';
import { BotDeterministico } from '@/adapters/bots/BotDeterministico';
import type { Carta } from '@/core/Carta';
import { Partida } from '@/core/Partida';
import { createEmissorEventos } from '@/store/emissor-eventos';
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
  private redesenhar?: ResizeDebouncer;
  private decisorHumano = new DecisorHumano();
  private mesaObjetos: Phaser.GameObjects.GameObject[] = [];
  private destaque: EstadoDestaque = {};
  private partida?: Partida;
  private labels: Phaser.GameObjects.Text[] = [];
  private tweenVez?: Phaser.Tweens.Tween;

  constructor() {
    super({ key: 'JogoScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#1a1a2e');
    this.partida = this.criarPartida();
    this.partida.distribuir(4);
    this.desenharMaos(this.partida.estado.maos);
    this.atualizarIndicadorVez();
    void this.iniciarProcessamentoTurno();
    this.redesenhar = criarDebounceResize(this, this.redesenharTela);
    this.scale.on('resize', this.redesenhar);
    this.events.once('shutdown', this.aoEncerrar);
  }

  private criarPartida(): Partida {
    const emissor = createEmissorEventos();
    emissor.on('CARTA_JOGADA', () => {
      this.redesenharTela();
    });
    const decisores = new Map<string, import('@/core/portas/DecisorJogada').DecisorJogada>([
      ['humano', this.decisorHumano],
      ['bot1', new BotDeterministico()],
      ['bot2', new BotDeterministico()],
      ['bot3', new BotDeterministico()],
    ]);
    return new Partida(JOGADORES, decisores, emissor);
  }

  private async iniciarProcessamentoTurno(): Promise<void> {
    while (this.partida && this.partida.estado.fase !== 'turnoConcluido') {
      const jogadorAtual = this.partida.estado.jogadorAtual;
      const ehBot = this.partida.estado.maos[jogadorAtual].jogador.id !== 'humano';
      if (ehBot) await this.esperar(500);
      await this.partida.jogarTurno();
      this.atualizarIndicadorVez();
    }
  }

  private esperar(ms: number): Promise<void> {
    return new Promise((resolve) => this.time.delayedCall(ms, resolve));
  }

  private atualizarMesa(): void {
    this.limparMesa();
    if (this.partida) renderizarMesa({ cena: this, mesa: this.partida.estado.mesa, objetos: this.mesaObjetos });
  }

  private atualizarIndicadorVez(): void {
    this.labels.forEach((label, i) => {
      label.setColor(this.partida && i === this.partida.estado.jogadorAtual ? '#ffff00' : '#ffffff');
    });
    if (this.tweenVez) {
      this.tweenVez.stop();
      this.tweenVez.remove();
      this.tweenVez = undefined;
    }
    if (this.partida) {
      this.tweenVez = this.tweens.add({
        targets: this.labels[this.partida.estado.jogadorAtual],
        scale: { from: 1, to: 1.2 },
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private redesenharTela = (): void => {
    destruirDestaque(this.destaque);
    this.limparObjetos();
    this.limparMesa();
    if (this.partida) {
      this.desenharMaos(this.partida.estado.maos);
      this.atualizarMesa();
      this.atualizarIndicadorVez();
    }
  };

  private desenharMaos(maos: MaoJogador[]): void {
    this.labels = [];
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
      this.labels.push(label);
      const objetosMao = renderizarMao({ cena: this, posicao: p.mao, cartas: mao.cartas, visivel: mao.visivel });
      this.objetos.push(...objetosMao);
      if (mao.jogador.id === 'humano') this.configurarInteracaoHumano(objetosMao, mao.cartas);
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
    if (!this.partida || this.partida.estado.maos[this.partida.estado.jogadorAtual].jogador.id !== 'humano') {
      return;
    }
    if (this.destaque.container === container) {
      this.decisorHumano.confirmar();
      return;
    }
    this.decisorHumano.selecionar(carta);
    destacarCarta(this, container, this.destaque);
  }

  private aoClicarFundo(): void {
    this.decisorHumano.desmarcar();
    removerDestaque(this.destaque);
  }

  private aoEncerrar = (): void => {
    if (this.redesenhar) {
      this.scale.off('resize', this.redesenhar);
      this.redesenhar.limpar();
      this.redesenhar = undefined;
    }
    if (this.tweenVez) {
      this.tweenVez.stop();
      this.tweenVez.remove();
      this.tweenVez = undefined;
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
