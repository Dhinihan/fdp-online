import { Scene } from 'phaser';
import { Partida } from '@/core/Partida';
import { Rodada } from '@/core/Rodada';
import { DecisorDeclaracaoHumano } from '../DecisorDeclaracaoHumano';
import { DecisorHumano } from '../DecisorHumano';
import { fabricarPartida } from '../factories/rodada-factory';
import { criarFundoInterativo } from '../input/input-humano';
import { criarDebounceResize, type ResizeDebouncer } from '../redimensionamento';
import { destruirDestaque, type EstadoDestaque } from '../renderers/destaque-renderer';
import { desenharIndicadorRodada } from '../renderers/indicador-rodada-renderer';
import { limparObjetos } from '../renderers/limpar-objetos';
import { desenharManilha, limparManilha } from '../renderers/manilha-renderer';
import { renderizarMesa } from '../renderers/mesa-renderer';
import {
  animarRecolhimentoTurno,
  atualizarIndicadorVez,
  mostrarOverlayRodadaConcluida,
} from '../renderers/turno-renderer';
import { desenharMaosJogo } from './desenhar-maos-jogo';
import { JOGADORES } from './jogadores';
import { iniciarProcessamentoTurno, processarDeclaracoes } from './jogo-scene-loop';

export class JogoScene extends Scene {
  private objetos: Phaser.GameObjects.GameObject[] = [];
  private redesenhar?: ResizeDebouncer;
  private decisorHumano = new DecisorHumano();
  private decisorDeclaracaoHumano = new DecisorDeclaracaoHumano();
  private mesaObjetos: Phaser.GameObjects.GameObject[] = [];
  private objetosDeclaracao: Phaser.GameObjects.GameObject[] = [];
  private destaque: EstadoDestaque = {};
  private partida?: Partida;
  private labels: Phaser.GameObjects.Text[] = [];
  private direcoesLabels: ('horizontal' | 'vertical')[] = [];
  private tweenVez?: Phaser.Tweens.Tween;
  private turnoAnterior = 1;
  private vencedorTurno?: string;
  private manilhaObjetos: Phaser.GameObjects.GameObject[] = [];
  private indicadorRodadaObjetos: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super({ key: 'JogoScene' });
  }
  create(): void {
    this.cameras.main.setBackgroundColor('#1a1a2e');
    this.partida = this.criarPartida();
    this.iniciarNovaRodada();
    this.redesenhar = criarDebounceResize(this, this.redesenharTela);
    this.scale.on('resize', this.redesenhar);
    this.events.once('shutdown', this.aoEncerrar);
  }
  private iniciarFluxoDeclaracao(): void {
    const rodada = this.partida?.rodadaAtual;
    if (!rodada) return;
    void processarDeclaracoes({
      cena: this,
      rodada,
      objetos: this.objetosDeclaracao,
      decisorHumano: this.decisorDeclaracaoHumano,
      atualizarIndicadorVez: this.atualizarIndicadorVez.bind(this),
      iniciarTurnos: this.iniciarFluxoTurno.bind(this),
    }).catch(() => undefined);
  }
  private async iniciarFluxoTurno(): Promise<void> {
    const rodada = this.partida?.rodadaAtual;
    if (!rodada) return;
    await iniciarProcessamentoTurno({
      cena: this,
      rodada,
      getLabels: () => this.labels,
      getDirecoesLabels: () => this.direcoesLabels,
      turnoAnteriorRef: { valor: this.turnoAnterior },
      jogadores: JOGADORES,
      getVencedorTurno: () => this.vencedorTurno,
      animarRecolhimento: this.animarRecolhimentoTurno.bind(this),
      atualizarIndicadorVez: this.atualizarIndicadorVez.bind(this),
    });
  }
  private criarPartida(): Partida {
    return fabricarPartida(
      JOGADORES,
      { jogada: this.decisorHumano, declaracao: this.decisorDeclaracaoHumano },
      {
        onCartaJogada: this.redesenharTela,
        onTurnoGanho: (id) => {
          this.vencedorTurno = id;
        },
        onTurnoEmpatado: () => {
          this.vencedorTurno = undefined;
        },
        onRodadaEncerrada: this.transicionarRodada.bind(this),
        onManilhaVirada: this.atualizarManilha.bind(this),
        onRodadaIniciada: this.atualizarIndicadorRodada.bind(this),
      },
    );
  }
  private iniciarNovaRodada(): void {
    this.turnoAnterior = 1;
    this.vencedorTurno = undefined;
    this.partida?.iniciarProximaRodada();
    this.atualizarManilha();
    this.redesenharTela();
    this.iniciarFluxoDeclaracao();
  }
  private atualizarManilha(): void {
    limparManilha(this.manilhaObjetos);
    const estado = this.partida?.estado;
    if (!estado) return;
    const { cartaVirada, manilha } = estado;
    if (!cartaVirada) return;
    desenharManilha({ cena: this, cartaVirada, manilha, objetos: this.manilhaObjetos });
  }
  private atualizarIndicadorRodada(): void {
    const estado = this.partida?.estado;
    if (!estado?.numeroRodada) return;
    desenharIndicadorRodada({
      cena: this,
      numeroRodada: estado.numeroRodada,
      manilha: estado.manilha,
      objetos: this.indicadorRodadaObjetos,
    });
  }
  private atualizarMesa(): void {
    limparObjetos(this.mesaObjetos);
    const estado = this.partida?.estado;
    if (!estado) return;
    const cartas = estado.mesa.map((m) => m.carta);
    renderizarMesa({ cena: this, mesa: cartas, objetos: this.mesaObjetos });
  }
  private atualizarIndicadorVez(): void {
    const estado = this.partida?.estado;
    if (!estado) return;
    this.tweenVez = atualizarIndicadorVez({
      cena: this,
      labels: this.labels,
      jogadorAtual: estado.jogadorAtual,
      tweenAtual: this.tweenVez,
    });
  }
  private redesenharTela = (): void => {
    destruirDestaque(this.destaque);
    limparObjetos(this.objetos);
    this.atualizarManilha();
    this.atualizarIndicadorRodada();
    limparObjetos(this.mesaObjetos);
    const estado = this.partida?.estado;
    if (!estado) return;
    this.desenharMaos(estado.maos);
    this.atualizarMesa();
    this.atualizarIndicadorVez();
  };
  private desenharMaos(maos: Parameters<typeof desenharMaosJogo>[0]['maos']): void {
    this.labels = [];
    this.direcoesLabels = desenharMaosJogo({
      cena: this,
      maos,
      rodada: this.partida?.rodadaAtual as Rodada,
      decisorHumano: this.decisorHumano,
      destaque: this.destaque,
      objetos: this.objetos,
      labels: this.labels,
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
    limparObjetos(this.indicadorRodadaObjetos);
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
  private transicionarRodada(): void {
    mostrarOverlayRodadaConcluida(this, this.objetos);
    this.time.delayedCall(900, this.iniciarNovaRodada.bind(this));
  }
}
