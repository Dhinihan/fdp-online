import { Scene } from 'phaser';
import { VALOR_MINIMO } from '@/core/Carta';
import { Rodada } from '@/core/Rodada';
import { estadoEmJogo } from '@/types/estado-rodada';
import { DecisorHumano } from '../DecisorHumano';
import { calcularLayout, type LayoutPainel, type Retangulo } from '../layout';
import { criarDebounceResize, type ResizeDebouncer } from '../redimensionamento';
import { destruirDestaque, type EstadoDestaque } from '../renderers/destaque-renderer';
import { limparObjetos } from '../renderers/limpar-objetos';
import { renderizarMesa } from '../renderers/mesa-renderer';
import { desenharPainelInfo } from '../renderers/painel-info-renderer';
import { animarRecolhimentoTurno, atualizarIndicadorVez } from '../renderers/turno-renderer';
import { aoEncerrarCena, desativarResize, transicionarRodada } from './ciclo-vida-cena';
import { desenharMaosJogo } from './desenhar-maos-jogo';
import { mostrarFimJogoDaCena } from './fim-jogo-scene';
import { JogoController, type DependenciasCena } from './jogo-controller';

export class JogoScene extends Scene {
  objetos: Phaser.GameObjects.GameObject[] = [];
  mesaObjetos: Phaser.GameObjects.GameObject[] = [];
  objetosDeclaracao: Phaser.GameObjects.GameObject[] = [];
  destaque: EstadoDestaque = {};
  painelObjetos: Phaser.GameObjects.GameObject[] = [];
  fimJogoObjetos: Phaser.GameObjects.GameObject[] = [];
  private layout?: LayoutPainel;
  private redesenhar?: ResizeDebouncer;
  private decisorHumano = new DecisorHumano();
  private labels: Phaser.GameObjects.Text[] = [];
  private direcoesLabels: ('horizontal' | 'vertical')[] = [];
  private tweenVez?: Phaser.Tweens.Tween;
  private controller?: JogoController;

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
      transicionarRodada: (cb) => {
        transicionarRodada({ cena: this, objetos: this.objetos, callback: cb, gameArea: this.obterGameArea() });
      },
      mostrarFimJogo: (classificacao) => {
        mostrarFimJogoDaCena(this, classificacao);
      },
      desativarResize: () => {
        desativarResize(this, this.redesenhar);
      },
      getGameArea: () => this.obterGameArea(),
      objetosDeclaracao: this.objetosDeclaracao,
      getLabels: () => this.labels,
      getDirecoesLabels: () => this.direcoesLabels,
    };
  }

  private obterLayout(): LayoutPainel {
    const { width, height } = this.cameras.main;
    return calcularLayout(width, height);
  }

  private obterGameArea(): Retangulo {
    return this.obterLayout().gameArea;
  }

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
    });
  }

  private redesenharTela = (): void => {
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
    this.atualizarIndicadorVez();
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
  }

  private aoEncerrar = (): void => {
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
