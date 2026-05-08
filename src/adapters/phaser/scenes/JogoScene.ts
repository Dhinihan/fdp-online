import { Scene } from 'phaser';
import { Rodada } from '@/core/Rodada';
import { estadoEmJogo } from '@/types/estado-rodada';
import { DecisorHumano } from '../DecisorHumano';
import { criarDebounceResize, type ResizeDebouncer } from '../redimensionamento';
import { destruirDestaque, type EstadoDestaque } from '../renderers/destaque-renderer';
import { desenharIndicadorRodada } from '../renderers/indicador-rodada-renderer';
import { limparObjetos } from '../renderers/limpar-objetos';
import { renderizarMesa } from '../renderers/mesa-renderer';
import { desenharPlacar } from '../renderers/placar-renderer';
import { animarRecolhimentoTurno, atualizarIndicadorVez } from '../renderers/turno-renderer';
import { atualizarManilhaDaCena } from './atualizar-manilha-cena';
import { aoEncerrarCena, desativarResize, transicionarRodada } from './ciclo-vida-cena';
import { desenharMaosJogo } from './desenhar-maos-jogo';
import { mostrarFimJogoDaCena } from './fim-jogo-scene';
import { JogoController, type DependenciasCena } from './jogo-controller';

export class JogoScene extends Scene {
  objetos: Phaser.GameObjects.GameObject[] = [];
  mesaObjetos: Phaser.GameObjects.GameObject[] = [];
  objetosDeclaracao: Phaser.GameObjects.GameObject[] = [];
  destaque: EstadoDestaque = {};
  manilhaObjetos: Phaser.GameObjects.GameObject[] = [];
  indicadorRodadaObjetos: Phaser.GameObjects.GameObject[] = [];
  placarObjetos: Phaser.GameObjects.GameObject[] = [];
  fimJogoObjetos: Phaser.GameObjects.GameObject[] = [];
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
      atualizarPlacar: this.atualizarPlacar.bind(this),
      atualizarManilha: this.atualizarManilha.bind(this),
      atualizarIndicadorRodada: this.atualizarIndicadorRodada.bind(this),
      animarRecolhimentoTurno: this.animarRecolhimentoTurno.bind(this),
      transicionarRodada: (cb) => {
        transicionarRodada(this, this.objetos, cb);
      },
      mostrarFimJogo: (classificacao) => {
        mostrarFimJogoDaCena(this, classificacao);
      },
      desativarResize: () => {
        desativarResize(this, this.redesenhar);
      },
      objetosDeclaracao: this.objetosDeclaracao,
      getLabels: () => this.labels,
      getDirecoesLabels: () => this.direcoesLabels,
    };
  }

  private atualizarManilha(): void {
    atualizarManilhaDaCena(this, this.controller?.partida, this.manilhaObjetos);
  }

  private atualizarIndicadorRodada(): void {
    const estado = this.controller?.partida?.estado;
    if (!estado || estado.fase === 'distribuindo' || !estado.numeroRodada) return;
    desenharIndicadorRodada({
      cena: this,
      numeroRodada: estado.numeroRodada,
      manilha: estado.manilha,
      objetos: this.indicadorRodadaObjetos,
    });
  }

  private atualizarPlacar(): void {
    const estado = this.controller?.partida?.estado;
    if (!estado || estado.fase === 'distribuindo') return;
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
    const estado = this.controller?.partida?.estado;
    if (!estado || estado.fase === 'distribuindo') return;
    this.desenharMaos(estado.maos);
    limparObjetos(this.mesaObjetos);
    const cartas = estado.mesa.map((m) => m.carta);
    renderizarMesa({ cena: this, mesa: cartas, objetos: this.mesaObjetos });
    this.atualizarIndicadorVez();
  };

  private desenharMaos(maos: Parameters<typeof desenharMaosJogo>[0]['maos']): void {
    const rodada = this.controller?.partida?.rodadaAtual as Rodada;
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
