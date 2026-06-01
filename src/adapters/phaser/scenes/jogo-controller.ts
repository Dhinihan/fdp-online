import type { Scene } from 'phaser';
import type { Partida } from '@/core/Partida';
import { registrarPartidaNoArmazenamento } from '@/store/ranking/gravar-ranking';
import type { Jogador } from '@/types/entidades';
import { ehFaseDeclaracao, estadoEmJogo } from '@/types/estado-rodada';
import { DecisorDeclaracaoHumano } from '../DecisorDeclaracaoHumano';
import type { DecisorHumano } from '../DecisorHumano';
import { fabricarPartida } from '../factories/rodada-factory';
import type { Retangulo } from '../layout';
import { desenharBotoesDeclaracao, limparObjetosDeclaracao } from '../renderers/declaracao-renderer';
import { JOGADORES } from './jogadores';
import { iniciarProcessamentoTurno, processarDeclaracoes } from './jogo-scene-loop';

interface PlacarRodada {
  placar: Record<string, number>;
  penalidades: Record<string, number>;
}

export interface PontuacaoRodada extends PlacarRodada {
  numeroRodada: number;
  jogadores: Jogador[];
}

export interface DependenciasCena {
  scene: Scene;
  decisorHumano: DecisorHumano;
  redesenharTela: () => void;
  atualizarIndicadorVez: () => void;
  atualizarPainel: () => void;
  animarRecolhimentoTurno: () => void;
  mostrarResumoRodada: (resumoRodada: PontuacaoRodada, onContinuar: () => void) => void;
  mostrarFimJogo: (classificacao: Jogador[]) => void;
  desativarResize: () => void;
  getGameArea: () => Retangulo;
  objetosDeclaracao: Phaser.GameObjects.GameObject[];
  getLabels: () => Phaser.GameObjects.Text[];
  getDirecoesLabels: () => ('horizontal' | 'vertical')[];
  modoDebug: boolean;
  renderizarBadges: (jogadorIdAnimar?: string) => void;
  limparBadges: () => void;
}

export class JogoController {
  partida?: Partida;
  vencedorTurno?: string;
  private turnoAnterior = 1;
  private valorDeclaracaoAtual = 0;
  private ultimaPontuacao: PlacarRodada = { placar: {}, penalidades: {} };
  private processamentoTurno?: Promise<void>;
  private readonly decisorDeclaracaoHumano = new DecisorDeclaracaoHumano();

  private readonly deps: DependenciasCena;

  constructor(deps: DependenciasCena) {
    this.deps = deps;
  }

  iniciar(): void {
    this.criarPartida();
    this.iniciarNovaRodada();
  }

  private criarPartida(): void {
    this.partida = fabricarPartida(
      JOGADORES,
      { jogada: this.deps.decisorHumano, declaracao: this.decisorDeclaracaoHumano },
      this.criarCallbacksPartida(),
    );
  }

  private criarCallbacksPartida() {
    return {
      onCartaJogada: this.deps.redesenharTela,
      onTurnoGanho: (id: string) => {
        this.vencedorTurno = id;
      },
      onTurnoEmpatado: () => {
        this.vencedorTurno = undefined;
      },
      onRodadaEncerrada: () => {
        this.aoRodadaEncerrada();
      },
      onManilhaVirada: this.deps.atualizarPainel,
      onRodadaIniciada: this.deps.atualizarPainel,
      onPontuacaoAplicada: (placar: Record<string, number>, penalidades: Record<string, number>) => {
        this.ultimaPontuacao = { placar, penalidades };
        this.deps.atualizarPainel();
      },
      onJogoEncerrado: (classificacao: Jogador[]) => {
        registrarPartidaNoArmazenamento(window.localStorage, classificacao);
        this.deps.desativarResize();
        this.deps.mostrarFimJogo(classificacao);
      },
      modoDebug: this.deps.modoDebug,
    };
  }

  private aoRodadaEncerrada(): void {
    const aguardarLimpeza = this.processamentoTurno ?? Promise.resolve();
    this.deps.mostrarResumoRodada(this.montarResumoRodada(), () => {
      void this.continuarAposResumo(aguardarLimpeza);
    });
  }

  private montarResumoRodada(): PontuacaoRodada {
    const rodada = this.partida?.rodadaAtual;
    const jogadores = rodada ? estadoEmJogo(rodada.estado).maos.map((m) => m.jogador) : [];
    return { ...this.ultimaPontuacao, numeroRodada: this.partida?.estado.numeroRodada ?? 0, jogadores };
  }

  private async continuarAposResumo(aguardarLimpeza: Promise<void>): Promise<void> {
    await aguardarLimpeza.catch(() => undefined);
    this.iniciarNovaRodada();
  }

  iniciarNovaRodada(): void {
    this.turnoAnterior = 1;
    this.valorDeclaracaoAtual = 0;
    this.vencedorTurno = undefined;
    const rodada = this.partida?.iniciarProximaRodada();
    if (!rodada) return;
    this.deps.redesenharTela();
    this.iniciarFluxoDeclaracao();
  }

  redesenharDeclaracaoAtual(): void {
    const rodada = this.partida?.rodadaAtual;
    if (!rodada) return;
    const estado = rodada.estado;
    if (!ehFaseDeclaracao(estado.fase)) return;
    const emJogo = estadoEmJogo(estado);
    const maoAtual = emJogo.maos[emJogo.jogadorAtual];
    if (maoAtual.jogador.id !== 'humano') return;
    limparObjetosDeclaracao(this.deps.objetosDeclaracao);
    desenharBotoesDeclaracao({
      cena: this.deps.scene,
      maximo: emJogo.cartasPorRodada,
      objetos: this.deps.objetosDeclaracao,
      gameArea: this.deps.getGameArea(),
      valorInicial: this.valorDeclaracaoAtual,
      onAlterar: this.atualizarValorDeclaracao,
      onSelecionar: (valor) => {
        this.decisorDeclaracaoHumano.confirmar(valor);
      },
    });
  }

  private atualizarValorDeclaracao = (valor: number): void => {
    this.valorDeclaracaoAtual = valor;
  };

  private iniciarFluxoDeclaracao(): void {
    const rodada = this.partida?.rodadaAtual;
    if (!rodada) return;
    void processarDeclaracoes({
      cena: this.deps.scene,
      rodada,
      objetos: this.deps.objetosDeclaracao,
      decisorHumano: this.decisorDeclaracaoHumano,
      getGameArea: this.deps.getGameArea,
      getValorDeclaracao: () => this.valorDeclaracaoAtual,
      onAlterarDeclaracao: this.atualizarValorDeclaracao,
      atualizarIndicadorVez: this.deps.atualizarIndicadorVez,
      atualizarPainel: this.deps.atualizarPainel,
      renderizarBadges: this.deps.renderizarBadges,
      limparBadges: this.deps.limparBadges,
      iniciarTurnos: this.iniciarFluxoTurno.bind(this),
    }).catch(() => undefined);
  }

  private async iniciarFluxoTurno(): Promise<void> {
    const rodada = this.partida?.rodadaAtual;
    if (!rodada) return;
    const processamento = iniciarProcessamentoTurno({
      cena: this.deps.scene,
      rodada,
      getLabels: this.deps.getLabels,
      getDirecoesLabels: this.deps.getDirecoesLabels,
      turnoAnteriorRef: { valor: this.turnoAnterior },
      jogadores: estadoEmJogo(rodada.estado).maos.map((m) => m.jogador),
      getVencedorTurno: () => this.vencedorTurno,
      animarRecolhimento: this.deps.animarRecolhimentoTurno,
      atualizarIndicadorVez: this.deps.atualizarIndicadorVez,
      atualizarPainel: this.deps.atualizarPainel,
    });
    this.processamentoTurno = processamento;
    try {
      await processamento;
    } finally {
      this.processamentoTurno = undefined;
    }
  }
}
