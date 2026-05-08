import type { Scene } from 'phaser';
import type { Partida } from '@/core/Partida';
import type { Jogador } from '@/types/entidades';
import { estadoEmJogo } from '@/types/estado-rodada';
import { DecisorDeclaracaoHumano } from '../DecisorDeclaracaoHumano';
import type { DecisorHumano } from '../DecisorHumano';
import { fabricarPartida } from '../factories/rodada-factory';
import { JOGADORES } from './jogadores';
import { iniciarProcessamentoTurno, processarDeclaracoes } from './jogo-scene-loop';

export interface DependenciasCena {
  scene: Scene;
  decisorHumano: DecisorHumano;
  redesenharTela: () => void;
  atualizarIndicadorVez: () => void;
  atualizarPlacar: () => void;
  atualizarManilha: () => void;
  atualizarIndicadorRodada: () => void;
  animarRecolhimentoTurno: () => void;
  transicionarRodada: (continuar: () => void) => void;
  mostrarFimJogo: (classificacao: Jogador[]) => void;
  desativarResize: () => void;
  objetosDeclaracao: Phaser.GameObjects.GameObject[];
  getLabels: () => Phaser.GameObjects.Text[];
  getDirecoesLabels: () => ('horizontal' | 'vertical')[];
}

export class JogoController {
  partida?: Partida;
  vencedorTurno?: string;
  private turnoAnterior = 1;
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
      {
        onCartaJogada: this.deps.redesenharTela,
        onTurnoGanho: (id) => {
          this.vencedorTurno = id;
        },
        onTurnoEmpatado: () => {
          this.vencedorTurno = undefined;
        },
        onRodadaEncerrada: () => {
          this.deps.transicionarRodada(this.iniciarNovaRodada.bind(this));
        },
        onManilhaVirada: this.deps.atualizarManilha,
        onRodadaIniciada: this.deps.atualizarIndicadorRodada,
        onPontuacaoAplicada: this.deps.atualizarPlacar,
        onJogoEncerrado: (classificacao) => {
          this.deps.desativarResize();
          this.deps.mostrarFimJogo(classificacao);
        },
      },
    );
  }

  iniciarNovaRodada(): void {
    this.turnoAnterior = 1;
    this.vencedorTurno = undefined;
    const rodada = this.partida?.iniciarProximaRodada();
    if (!rodada) return;
    this.deps.redesenharTela();
    this.iniciarFluxoDeclaracao();
  }

  private iniciarFluxoDeclaracao(): void {
    const rodada = this.partida?.rodadaAtual;
    if (!rodada) return;
    void processarDeclaracoes({
      cena: this.deps.scene,
      rodada,
      objetos: this.deps.objetosDeclaracao,
      decisorHumano: this.decisorDeclaracaoHumano,
      atualizarIndicadorVez: this.deps.atualizarIndicadorVez,
      atualizarPlacar: this.deps.atualizarPlacar,
      iniciarTurnos: this.iniciarFluxoTurno.bind(this),
    }).catch(() => undefined);
  }

  private async iniciarFluxoTurno(): Promise<void> {
    const rodada = this.partida?.rodadaAtual;
    if (!rodada) return;
    await iniciarProcessamentoTurno({
      cena: this.deps.scene,
      rodada,
      getLabels: this.deps.getLabels,
      getDirecoesLabels: this.deps.getDirecoesLabels,
      turnoAnteriorRef: { valor: this.turnoAnterior },
      jogadores: estadoEmJogo(rodada.estado).maos.map((m) => m.jogador),
      getVencedorTurno: () => this.vencedorTurno,
      animarRecolhimento: this.deps.animarRecolhimentoTurno,
      atualizarIndicadorVez: this.deps.atualizarIndicadorVez,
    });
  }
}
