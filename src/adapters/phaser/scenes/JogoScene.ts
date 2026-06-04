import { Scene } from 'phaser';
import { VALOR_MINIMO } from '@/core/Carta';
import { Rodada } from '@/core/Rodada';
import { ehFaseDeclaracao, estadoEmJogo } from '@/types/estado-rodada';
import { abrirTutorial } from '../../tutorial/tutorial-overlay';
import { DecisorHumano } from '../DecisorHumano';
import { calcularLayout, type LayoutPainel, type Retangulo } from '../layout';
import { criarDebounceResize, type ResizeDebouncer } from '../redimensionamento';
import { renderizarBadgesDeclaradoTurno0 } from '../renderers/declarado-turno0-renderer';
import { destruirDestaque, type EstadoDestaque } from '../renderers/destaque-renderer';
import { limparObjetos } from '../renderers/limpar-objetos';
import { renderizarMesa } from '../renderers/mesa-renderer';
import { calcularMinimosPainel, desenharPainelInfo } from '../renderers/painel-info-renderer';
import { mostrarResumoRodada } from '../renderers/resumo-rodada-renderer';
import { animarRecolhimentoTurno, atualizarIndicadorVez } from '../renderers/turno-renderer';
import { aoEncerrarCena } from './ciclo-vida-cena';
import { desenharMaosJogo } from './desenhar-maos-jogo';
import { mostrarFimJogoDaCena, type EstadoFimJogo } from './fim-jogo-scene';
import { JOGADORES } from './jogadores';
import { JogoController, type DependenciasCena, type PontuacaoRodada } from './jogo-controller';

export class JogoScene extends Scene {
  objetos: Phaser.GameObjects.GameObject[] = [];
  mesaObjetos: Phaser.GameObjects.GameObject[] = [];
  objetosDeclaracao: Phaser.GameObjects.GameObject[] = [];
  objetosDeclaradoTurno0: Phaser.GameObjects.GameObject[] = [];
  destaque: EstadoDestaque = {};
  painelObjetos: Phaser.GameObjects.GameObject[] = [];
  fimJogoObjetos: Phaser.GameObjects.GameObject[] = [];
  resumoObjetos: Phaser.GameObjects.GameObject[] = [];
  private layout?: LayoutPainel;
  private redesenhar?: ResizeDebouncer;
  private decisorHumano = new DecisorHumano();
  private labels: Phaser.GameObjects.Text[] = [];
  private direcoesLabels: ('horizontal' | 'vertical')[] = [];
  private centrosMaos: { x: number; y: number }[] = [];
  private tweenVez?: Phaser.Tweens.Tween;
  private controller?: JogoController;
  private resumoAtivo?: PontuacaoRodada;
  private aoContinuarResumo?: () => void;
  private fimJogoAtivo?: EstadoFimJogo;

  constructor() {
    super({ key: 'JogoScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#1a1a2e');
    this.controller = new JogoController(this.criarDependencias());
    this.controller.iniciar();
    this.redesenhar = criarDebounceResize(this, this.redesenharTela);
    this.scale.on('resize', this.redesenhar);
    this.events.once('shutdown', this.aoEncerrar);
  }

  private criarDependencias(): DependenciasCena {
    return {
      scene: this,
      decisorHumano: this.decisorHumano,
      redesenharTela: this.redesenharTela,
      atualizarIndicadorVez: this.atualizarIndicadorVez.bind(this),
      atualizarPainel: this.atualizarPainel.bind(this),
      animarRecolhimentoTurno: this.animarRecolhimentoTurno.bind(this),
      mostrarResumoRodada: (resumoRodada, onContinuar) => {
        this.exibirResumoRodada(resumoRodada, onContinuar);
      },
      mostrarFimJogo: (classificacao, resultadoTrofeus) => {
        this.fimJogoAtivo = { classificacao, resultadoTrofeus };
        this.renderizarFimJogo(true);
      },
      getGameArea: () => this.obterGameArea(),
      objetosDeclaracao: this.objetosDeclaracao,
      getLabels: () => this.labels,
      getDirecoesLabels: () => this.direcoesLabels,
      modoDebug: Boolean(this.game.registry.get('modoDebug')),
      renderizarBadges: this.renderizarBadges.bind(this),
      limparBadges: this.limparBadges.bind(this),
    };
  }

  private obterLayout(): LayoutPainel {
    const { width, height } = this.cameras.main;
    return calcularLayout(width, height, calcularMinimosPainel(this, this.contarJogadores()));
  }

  private contarJogadores(): number {
    const estado = this.controller?.partida?.estado;
    if (estado && estado.fase !== 'distribuindo') return estadoEmJogo(estado).maos.length;
    return JOGADORES.length;
  }

  private obterGameArea(): Retangulo {
    return this.obterLayout().gameArea;
  }

  private exibirResumoRodada(resumoRodada: PontuacaoRodada, onContinuar: () => void): void {
    this.resumoAtivo = resumoRodada;
    this.aoContinuarResumo = onContinuar;
    this.renderizarResumoRodada();
  }

  private renderizarResumoRodada(): void {
    if (!this.resumoAtivo || !this.aoContinuarResumo) return;
    limparObjetos(this.resumoObjetos);
    mostrarResumoRodada({
      cena: this,
      numeroRodada: this.resumoAtivo.numeroRodada,
      jogadores: this.resumoAtivo.jogadores,
      placar: this.resumoAtivo.placar,
      penalidades: this.resumoAtivo.penalidades,
      objetos: this.resumoObjetos,
      onContinuar: this.continuarResumoRodada,
    });
  }

  private continuarResumoRodada = (): void => {
    const onContinuar = this.aoContinuarResumo;
    this.resumoAtivo = undefined;
    this.aoContinuarResumo = undefined;
    onContinuar?.();
  };

  private atualizarPainel(): void {
    this.layout = this.obterLayout();
    const estado = this.controller?.partida?.estado;
    if (!estado) return;
    const emJogo = estado.fase !== 'distribuindo' ? estadoEmJogo(estado) : null;
    const jogadores = emJogo ? emJogo.maos.map((m) => m.jogador) : [];
    desenharPainelInfo({
      cena: this,
      jogadores,
      estado,
      numeroRodada: estado.numeroRodada,
      manilha: emJogo?.manilha ?? VALOR_MINIMO,
      cartaVirada: emJogo?.cartaVirada ?? null,
      layout: this.layout,
      objetos: this.painelObjetos,
      aoAbrirRanking: this.abrirRanking,
      aoAbrirTutorial: this.mostrarTutorial,
    });
  }

  private abrirRanking = (): void => {
    this.scene.launch('RankingScene');
    this.scene.pause();
  };

  private mostrarTutorial = (): void => {
    this.scene.pause();
    abrirTutorial({
      aoFechar: () => {
        this.scene.resume();
      },
    });
  };

  private renderizarFimJogo(primeiraExibicao: boolean): void {
    if (!this.fimJogoAtivo) return;
    mostrarFimJogoDaCena(this, this.fimJogoAtivo, primeiraExibicao);
  }

  private redesenharTela = (): void => {
    // A tela de fim de jogo sobrepõe o tabuleiro; no resize ela se reposiciona
    // sozinha, sem redesenhar o jogo por baixo.
    if (this.fimJogoAtivo) {
      this.renderizarFimJogo(false);
      return;
    }
    destruirDestaque(this.destaque);
    limparObjetos(this.objetos);
    this.atualizarPainel();
    limparObjetos(this.mesaObjetos);
    const estado = this.controller?.partida?.estado;
    if (!estado || estado.fase === 'distribuindo') return;
    const gameArea = this.obterGameArea();
    this.desenharMaos(estado.maos, gameArea);
    const cartas = estado.mesa.map((m) => m.carta);
    renderizarMesa({ cena: this, mesa: cartas, objetos: this.mesaObjetos, gameArea });
    this.controller?.redesenharDeclaracaoAtual();
    this.sincronizarBadges();
    this.atualizarIndicadorVez();
    this.renderizarResumoRodada();
  };

  private desenharMaos(maos: Parameters<typeof desenharMaosJogo>[0]['maos'], gameArea: Retangulo): void {
    const rodada = this.controller?.partida?.rodadaAtual as Rodada;
    const resultado = desenharMaosJogo({
      cena: this,
      maos,
      gameArea,
      rodada,
      decisorHumano: this.decisorHumano,
      destaque: this.destaque,
      objetos: this.objetos,
    });
    this.labels = resultado.labels;
    this.direcoesLabels = resultado.direcoes;
    this.centrosMaos = resultado.centrosMaos;
  }

  private renderizarBadges(jogadorIdAnimar?: string): void {
    const estado = this.controller?.partida?.estado;
    if (!estado || estado.fase === 'distribuindo') return;
    const emJogo = estadoEmJogo(estado);
    renderizarBadgesDeclaradoTurno0({
      cena: this,
      jogadores: emJogo.maos.map((m) => m.jogador),
      declaracoes: emJogo.declaracoes,
      centrosMaos: this.centrosMaos,
      objetos: this.objetosDeclaradoTurno0,
      gameArea: this.obterGameArea(),
      jogadorIdAnimar,
    });
  }

  private limparBadges(): void {
    limparObjetos(this.objetosDeclaradoTurno0);
  }

  private sincronizarBadges(): void {
    const estado = this.controller?.partida?.estado;
    if (!estado) return;
    if (ehFaseDeclaracao(estado.fase)) {
      this.renderizarBadges();
      return;
    }
    this.limparBadges();
  }

  private aoEncerrar = (): void => {
    this.limparBadges();
    limparObjetos(this.resumoObjetos);
    this.resumoAtivo = undefined;
    this.aoContinuarResumo = undefined;
    this.fimJogoAtivo = undefined;
    aoEncerrarCena({
      cena: this,
      redesenhar: this.redesenhar,
      tweenVez: this.tweenVez,
      objetos: this.objetos,
      mesaObjetos: this.mesaObjetos,
      painelObjetos: this.painelObjetos,
      fimJogoObjetos: this.fimJogoObjetos,
      destaque: this.destaque,
    });
  };

  private atualizarIndicadorVez(): void {
    const estado = this.controller?.partida?.estado;
    if (!estado) return;
    this.tweenVez = atualizarIndicadorVez({
      cena: this,
      labels: this.labels,
      jogadorAtual: estado.jogadorAtual,
      tweenAtual: this.tweenVez,
    });
  }

  private animarRecolhimentoTurno(): void {
    const rodada = this.controller?.partida?.rodadaAtual;
    const jogadoresAtuais = rodada ? estadoEmJogo(rodada.estado).maos.map((m) => m.jogador) : [];
    const objetosParaAnimar = this.mesaObjetos.filter((obj) => obj.active);
    this.mesaObjetos = [];
    animarRecolhimentoTurno({
      cena: this,
      labels: this.labels,
      jogadores: jogadoresAtuais,
      vencedorId: this.controller?.vencedorTurno,
      mesaObjetos: objetosParaAnimar,
    });
  }
}
