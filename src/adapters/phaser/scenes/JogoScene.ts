import { Scene } from 'phaser';
import { Partida } from '@/core/Partida';
import { Rodada } from '@/core/Rodada';
import { DecisorDeclaracaoHumano } from '../DecisorDeclaracaoHumano';
import { DecisorHumano } from '../DecisorHumano';
import { fabricarPartida } from '../factories/rodada-factory';
import { criarDebounceResize, type ResizeDebouncer } from '../redimensionamento';
import { destruirDestaque, type EstadoDestaque } from '../renderers/destaque-renderer';
import { desenharIndicadorRodada } from '../renderers/indicador-rodada-renderer';
import { limparObjetos } from '../renderers/limpar-objetos';
import { desenharManilha, limparManilha } from '../renderers/manilha-renderer';
import { renderizarMesa } from '../renderers/mesa-renderer';
import { desenharPlacar } from '../renderers/placar-renderer';
import { animarRecolhimentoTurno, atualizarIndicadorVez } from '../renderers/turno-renderer';
import { aoEncerrarCena, desativarResize, transicionarRodada } from './ciclo-vida-cena';
import { desenharMaosJogo } from './desenhar-maos-jogo';
import { mostrarFimJogoDaCena } from './fim-jogo-scene';
import { iniciarDeclaracaoDaCena, iniciarTurnosDaCena } from './fluxo-jogo-scene';
import { JOGADORES } from './jogadores';

export class JogoScene extends Scene {
  objetos: Phaser.GameObjects.GameObject[] = [];
  private redesenhar?: ResizeDebouncer;
  private decisorHumano = new DecisorHumano();
  private decisorDeclaracaoHumano = new DecisorDeclaracaoHumano();
  mesaObjetos: Phaser.GameObjects.GameObject[] = [];
  objetosDeclaracao: Phaser.GameObjects.GameObject[] = [];
  destaque: EstadoDestaque = {};
  private partida?: Partida;
  private labels: Phaser.GameObjects.Text[] = [];
  private direcoesLabels: ('horizontal' | 'vertical')[] = [];
  private tweenVez?: Phaser.Tweens.Tween;
  private turnoAnterior = 1;
  private vencedorTurno?: string;
  manilhaObjetos: Phaser.GameObjects.GameObject[] = [];
  indicadorRodadaObjetos: Phaser.GameObjects.GameObject[] = [];
  placarObjetos: Phaser.GameObjects.GameObject[] = [];
  fimJogoObjetos: Phaser.GameObjects.GameObject[] = [];
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
    iniciarDeclaracaoDaCena({
      cena: this,
      rodada,
      objetos: this.objetosDeclaracao,
      decisorHumano: this.decisorDeclaracaoHumano,
      atualizarIndicadorVez: this.atualizarIndicadorVez.bind(this),
      atualizarPlacar: this.atualizarPlacar.bind(this),
      iniciarTurnos: this.iniciarFluxoTurno.bind(this),
    });
  }
  private async iniciarFluxoTurno(): Promise<void> {
    const rodada = this.partida?.rodadaAtual;
    if (!rodada) return;
    await iniciarTurnosDaCena({
      cena: this,
      rodada,
      getLabels: () => this.labels,
      getDirecoesLabels: () => this.direcoesLabels,
      turnoAnteriorRef: { valor: this.turnoAnterior },
      jogadores: rodada.estado.maos.map((m) => m.jogador),
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
        onRodadaEncerrada: () => {
          transicionarRodada(this, this.objetos, this.iniciarNovaRodada.bind(this));
        },
        onManilhaVirada: this.atualizarManilha.bind(this),
        onRodadaIniciada: this.atualizarIndicadorRodada.bind(this),
        onPontuacaoAplicada: this.atualizarPlacar.bind(this),
        onJogoEncerrado: (classificacao) => {
          desativarResize(this, this.redesenhar);
          mostrarFimJogoDaCena(this, classificacao);
        },
      },
    );
  }
  private iniciarNovaRodada(): void {
    this.turnoAnterior = 1;
    this.vencedorTurno = undefined;
    const rodada = this.partida?.iniciarProximaRodada();
    if (!rodada) return;
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
  private atualizarPlacar(): void {
    const estado = this.partida?.estado;
    if (!estado) return;
    const jogadores = estado.maos.map((m) => m.jogador);
    desenharPlacar({ cena: this, jogadores, estado, objetos: this.placarObjetos });
  }
  private redesenharTela = (): void => {
    destruirDestaque(this.destaque);
    limparObjetos(this.objetos);
    this.atualizarManilha();
    this.atualizarIndicadorRodada();
    this.atualizarPlacar();
    limparObjetos(this.mesaObjetos);
    const estado = this.partida?.estado;
    if (!estado) return;
    this.desenharMaos(estado.maos);
    limparObjetos(this.mesaObjetos);
    const cartas = estado.mesa.map((m) => m.carta);
    renderizarMesa({ cena: this, mesa: cartas, objetos: this.mesaObjetos });
    this.atualizarIndicadorVez();
  };
  private desenharMaos(maos: Parameters<typeof desenharMaosJogo>[0]['maos']): void {
    const rodada = this.partida?.rodadaAtual as Rodada;
    const resultado = desenharMaosJogo({
      cena: this,
      maos,
      rodada,
      decisorHumano: this.decisorHumano,
      destaque: this.destaque,
      objetos: this.objetos,
    });
    this.labels = resultado.labels;
    this.direcoesLabels = resultado.direcoes;
  }
  private aoEncerrar = (): void => {
    aoEncerrarCena({
      cena: this,
      redesenhar: this.redesenhar,
      tweenVez: this.tweenVez,
      objetos: this.objetos,
      mesaObjetos: this.mesaObjetos,
      indicadorRodadaObjetos: this.indicadorRodadaObjetos,
      manilhaObjetos: this.manilhaObjetos,
      placarObjetos: this.placarObjetos,
      fimJogoObjetos: this.fimJogoObjetos,
      destaque: this.destaque,
    });
  };
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
  private animarRecolhimentoTurno(): void {
    const rodada = this.partida?.rodadaAtual;
    const jogadoresAtuais = rodada?.estado.maos.map((m) => m.jogador) ?? [];
    const objetosParaAnimar = this.mesaObjetos.filter((obj) => obj.active);
    this.mesaObjetos = [];
    animarRecolhimentoTurno({
      cena: this,
      labels: this.labels,
      jogadores: jogadoresAtuais,
      vencedorId: this.vencedorTurno,
      mesaObjetos: objetosParaAnimar,
    });
    this.vencedorTurno = undefined;
  }
}
