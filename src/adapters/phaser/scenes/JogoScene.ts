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
  private partida?: Rodada;
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
    this.partida = this.criarRodada();
    this.partida.distribuir(4);
    this.turnoAnterior = 1;
    this.atualizarManilha();
    this.desenharMaos(this.partida.estado.maos);
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
    if (!this.partida) return;
    const { cartaVirada, manilha } = this.partida.estado;
    if (!cartaVirada) return;
    desenharManilha({ cena: this, cartaVirada, manilha, objetos: this.manilhaObjetos });
  }
  private async iniciarProcessamentoTurno(): Promise<void> {
    while (this.partida && this.partida.estado.fase !== 'rodadaConcluida') {
      const jogadorAtual = this.partida.estado.jogadorAtual;
      const ehBot = this.partida.estado.maos[jogadorAtual].jogador.id !== 'humano';
      if (ehBot) await new Promise((resolve) => this.time.delayedCall(500, resolve));
      try {
        await this.partida.jogarTurno();
      } catch {
        break;
      }
      if (this.partida.estado.turno > this.turnoAnterior) {
        this.turnoAnterior = this.partida.estado.turno;
        const vencedorId = this.vencedorTurno;
        this.animarRecolhimentoTurno();
        await new Promise((resolve) => this.time.delayedCall(800, resolve));
        atualizarLabelVencedor({
          vencedorId,
          jogadores: JOGADORES,
          vazas: this.partida.estado.vazas,
          labels: this.labels,
          direcoes: this.direcoesLabels,
        });
      }
      this.atualizarIndicadorVez();
    }
  }
  private atualizarMesa(): void {
    this.limparMesa();
    if (!this.partida) return;
    const cartas = this.partida.estado.mesa.map((m) => m.carta);
    renderizarMesa({ cena: this, mesa: cartas, objetos: this.mesaObjetos });
  }
  private atualizarIndicadorVez(): void {
    if (!this.partida) return;
    this.tweenVez = atualizarIndicadorVez({
      cena: this,
      labels: this.labels,
      jogadorAtual: this.partida.estado.jogadorAtual,
      tweenAtual: this.tweenVez,
    });
  }
  private redesenharTela = (): void => {
    destruirDestaque(this.destaque);
    this.limparObjetos();
    this.atualizarManilha();
    this.limparMesa();
    if (!this.partida) return;
    this.desenharMaos(this.partida.estado.maos);
    this.atualizarMesa();
    this.atualizarIndicadorVez();
  };
  private desenharMaos(maos: MaoJogador[]): void {
    const posicoes = calcularPosicoes({
      largura: this.cameras.main.width,
      altura: this.cameras.main.height,
      margem: escalar(60, this),
      margemInferior: escalar(80, this),
      espacamentoCartas: escalar(40, this),
      alturaCarta: escalar(75, this),
      dpr: obterDpr(this),
    });
    this.direcoesLabels = posicoes.map((p) => p.mao.direcao);
    maos.forEach((mao, i) => {
      desenharMaoNaCena({
        cena: this,
        mao,
        posicao: posicoes[i],
        partida: this.partida as Rodada,
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
    this.limparObjetos();
    this.limparMesa();
    limparManilha(this.manilhaObjetos);
    destruirDestaque(this.destaque);
  };
  private limparObjetos(): void {
    for (const o of this.objetos) o.destroy();
    this.objetos = [];
  }
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
  private limparMesa(): void {
    for (const o of this.mesaObjetos) o.destroy();
    this.mesaObjetos = [];
  }
}
