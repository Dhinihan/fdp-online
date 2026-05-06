import { Scene } from 'phaser';
import { Rodada } from '@/core/Rodada';
import type { Jogador } from '@/types/entidades';
import type { MaoJogador } from '@/types/estado-rodada';
import { DecisorHumano } from '../DecisorHumano';
import { obterDpr, escalar } from '../escala';
import { fabricarRodada } from '../factories/rodada-factory';
import { criarFundoInterativo } from '../input/input-humano';
import { criarDebounceResize, type ResizeDebouncer } from '../redimensionamento';
import { destruirDestaque, type EstadoDestaque } from '../renderers/destaque-renderer';
import { atualizarLabelVencedor } from '../renderers/label-jogador';
import { limparObjetos } from '../renderers/limpar-objetos';
import { desenharManilha, limparManilha } from '../renderers/manilha-renderer';
import { desenharMaoNaCena } from '../renderers/mao-scene-renderer';
import { renderizarMesa } from '../renderers/mesa-renderer';
import { calcularPosicoes } from '../renderers/posicoes-mao';
import {
  animarRecolhimentoTurno,
  atualizarIndicadorVez,
  mostrarOverlayRodadaConcluida,
} from '../renderers/turno-renderer';

const JOGADORES: Jogador[] = [
  { id: 'humano', nome: 'Você', pontos: 5 },
  { id: 'bot1', nome: 'Bot 1', pontos: 5 },
  { id: 'bot2', nome: 'Bot 2', pontos: 5 },
  { id: 'bot3', nome: 'Bot 3', pontos: 5 },
];

export class JogoScene extends Scene {
  private objetos: Phaser.GameObjects.GameObject[] = [];
  private redesenhar?: ResizeDebouncer;
  private decisorHumano = new DecisorHumano();
  private mesaObjetos: Phaser.GameObjects.GameObject[] = [];
  private destaque: EstadoDestaque = {};
  private rodada?: Rodada;
  private labels: Phaser.GameObjects.Text[] = [];
  private direcoesLabels: ('horizontal' | 'vertical')[] = [];
  private tweenVez?: Phaser.Tweens.Tween;
  private turnoAnterior = 1;
  private vencedorTurno?: string;
  private manilhaObjetos: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super({ key: 'JogoScene' });
  }
  create(): void {
    this.cameras.main.setBackgroundColor('#1a1a2e');
    this.rodada = this.criarRodada();
    this.rodada.distribuir(4);
    this.turnoAnterior = 1;
    this.atualizarManilha();
    this.desenharMaos(this.rodada.estado.maos);
    this.atualizarIndicadorVez();
    void this.iniciarProcessamentoTurno();
    this.redesenhar = criarDebounceResize(this, this.redesenharTela);
    this.scale.on('resize', this.redesenhar);
    this.events.once('shutdown', this.aoEncerrar);
  }
  private criarRodada(): Rodada {
    return fabricarRodada(JOGADORES, this.decisorHumano, {
      onCartaJogada: () => {
        this.redesenharTela();
      },
      onTurnoGanho: (id) => {
        this.vencedorTurno = id;
      },
      onRodadaEncerrada: () => {
        this.mostrarOverlayRodadaConcluida();
      },
      onManilhaVirada: () => {
        this.atualizarManilha();
      },
    });
  }
  private atualizarManilha(): void {
    limparManilha(this.manilhaObjetos);
    if (!this.rodada) return;
    const { cartaVirada, manilha } = this.rodada.estado;
    if (!cartaVirada) return;
    desenharManilha({ cena: this, cartaVirada, manilha, objetos: this.manilhaObjetos });
  }
  private async iniciarProcessamentoTurno(): Promise<void> {
    while (this.rodada && this.rodada.estado.fase !== 'rodadaConcluida') {
      const jogadorAtual = this.rodada.estado.jogadorAtual;
      const ehBot = this.rodada.estado.maos[jogadorAtual].jogador.id !== 'humano';
      if (ehBot) await new Promise((resolve) => this.time.delayedCall(500, resolve));
      try {
        await this.rodada.jogarTurno();
      } catch {
        break;
      }
      if (this.rodada.estado.turno > this.turnoAnterior) {
        this.turnoAnterior = this.rodada.estado.turno;
        const vencedorId = this.vencedorTurno;
        this.animarRecolhimentoTurno();
        await new Promise((resolve) => this.time.delayedCall(800, resolve));
        atualizarLabelVencedor({
          vencedorId,
          jogadores: JOGADORES,
          vazas: this.rodada.estado.vazas,
          labels: this.labels,
          direcoes: this.direcoesLabels,
        });
      }
      this.atualizarIndicadorVez();
    }
  }
  private atualizarMesa(): void {
    limparObjetos(this.mesaObjetos);
    if (!this.rodada) return;
    const cartas = this.rodada.estado.mesa.map((m) => m.carta);
    renderizarMesa({ cena: this, mesa: cartas, objetos: this.mesaObjetos });
  }
  private atualizarIndicadorVez(): void {
    if (!this.rodada) return;
    this.tweenVez = atualizarIndicadorVez({
      cena: this,
      labels: this.labels,
      jogadorAtual: this.rodada.estado.jogadorAtual,
      tweenAtual: this.tweenVez,
    });
  }
  private redesenharTela = (): void => {
    destruirDestaque(this.destaque);
    limparObjetos(this.objetos);
    this.atualizarManilha();
    limparObjetos(this.mesaObjetos);
    if (!this.rodada) return;
    this.desenharMaos(this.rodada.estado.maos);
    this.atualizarMesa();
    this.atualizarIndicadorVez();
  };
  private calcularPosicoesMaos(): ReturnType<typeof calcularPosicoes> {
    return calcularPosicoes({
      largura: this.cameras.main.width,
      altura: this.cameras.main.height,
      margem: escalar(60, this),
      margemInferior: escalar(80, this),
      espacamentoCartas: escalar(40, this),
      alturaCarta: escalar(75, this),
      dpr: obterDpr(this),
    });
  }
  private desenharMaos(maos: MaoJogador[]): void {
    this.labels = [];
    const posicoes = this.calcularPosicoesMaos();
    this.direcoesLabels = posicoes.map((p) => p.mao.direcao);
    maos.forEach((mao, i) => {
      desenharMaoNaCena({
        cena: this,
        mao,
        posicao: posicoes[i],
        rodada: this.rodada as Rodada,
        decisorHumano: this.decisorHumano,
        destaque: this.destaque,
        objetos: this.objetos,
        labels: this.labels,
      });
    });
    criarFundoInterativo({
      cena: this,
      objetos: this.objetos,
      decisorHumano: this.decisorHumano,
      destaque: this.destaque,
    });
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
    limparObjetos(this.objetos);
    limparObjetos(this.mesaObjetos);
    limparManilha(this.manilhaObjetos);
    destruirDestaque(this.destaque);
  };
  private animarRecolhimentoTurno(): void {
    animarRecolhimentoTurno({
      cena: this,
      labels: this.labels,
      jogadores: JOGADORES,
      vencedorId: this.vencedorTurno,
      mesaObjetos: this.mesaObjetos,
    });
    this.vencedorTurno = undefined;
    this.mesaObjetos = [];
  }
  private mostrarOverlayRodadaConcluida(): void {
    mostrarOverlayRodadaConcluida(this, this.objetos);
  }
}
