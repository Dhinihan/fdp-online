import type { Jogador } from '@/types/entidades';
import type { EstadoPartida } from '@/types/estado-partida';
import type { EventoDominio } from '@/types/eventos-dominio';
import { criarEventoBase } from './eventos-rodada';
import type { DecisorDeclaracao } from './portas/DecisorDeclaracao';
import type { DecisorJogada } from './portas/DecisorJogada';
import { Rodada } from './Rodada';

interface EmissorPartida {
  emit(evento: EventoDominio): void;
}

interface DecisoresPartida {
  jogada: Map<string, DecisorJogada>;
  declaracao: Map<string, DecisorDeclaracao>;
}

export class Partida {
  private jogadores: Jogador[];
  private decisores: DecisoresPartida;
  private emissor: EmissorPartida;
  private numeroRodada = 0;
  private rodada?: Rodada;
  private embaralhadorIndice: number;
  private jogoEncerrado = false;
  private eliminados: Jogador[] = [];

  constructor(jogadores: Jogador[], emissor: EmissorPartida, decisores: DecisoresPartida) {
    this.jogadores = jogadores;
    this.emissor = emissor;
    this.decisores = decisores;
    this.embaralhadorIndice = jogadores.length - 1;
  }

  get rodadaAtual(): Rodada | undefined {
    return this.rodada;
  }

  get estado(): EstadoPartida {
    if (!this.rodada) return this.estadoInicial();
    return {
      ...this.rodada.estado,
      numeroRodada: this.numeroRodada,
      jogadoresAtivos: this.jogadoresAtivos(),
      embaralhadorId: this.embaralhadorAtual().id,
      jogoEncerrado: this.jogoEncerrado,
    };
  }

  iniciarProximaRodada(): Rodada | undefined {
    const teveEliminacao = this.atualizarPontosEEliminar();
    if (this.encerrarSeNecessario()) return undefined;
    this.numeroRodada = teveEliminacao ? 1 : this.numeroRodada + 1;
    if (this.numeroRodada > 1) this.rotacionarEmbaralhador();
    this.rodada = new Rodada(this.jogadores, this.emissor, { ...this.decisores, numeroRodada: this.numeroRodada });
    const cartasPorRodada = Math.min(this.numeroRodada, 13);
    this.rodada.distribuir(cartasPorRodada);
    this.emitirRodadaIniciada(cartasPorRodada);
    return this.rodada;
  }

  avancarSeRodadaConcluida(): boolean {
    if (this.rodada?.estado.fase !== 'rodadaConcluida') return false;
    this.iniciarProximaRodada();
    return true;
  }

  private estadoInicial(): EstadoPartida {
    return {
      fase: 'distribuindo',
      jogadorAtual: 0,
      mesa: [],
      maos: [],
      vazas: {},
      turno: 1,
      cartasPorRodada: 0,
      manilha: '3',
      cartaVirada: null,
      declaracoes: {},
      pontos: Object.fromEntries(this.jogadores.map((jogador) => [jogador.id, jogador.pontos])),
      numeroRodada: this.numeroRodada,
      jogadoresAtivos: this.jogadoresAtivos(),
      embaralhadorId: this.embaralhadorAtual().id,
      jogoEncerrado: this.jogoEncerrado,
    };
  }

  private atualizarPontosEEliminar(): boolean {
    if (!this.rodada) return false;
    this.jogadores = this.jogadores.map((jogador) => ({
      ...jogador,
      pontos: this.rodada?.estado.pontos[jogador.id] ?? jogador.pontos,
    }));
    return this.eliminarJogadoresSemPontos();
  }

  private eliminarJogadoresSemPontos(): boolean {
    const eliminados = this.jogadores.filter((jogador) => jogador.pontos <= 0);
    if (eliminados.length === 0) return false;
    this.eliminados = [...this.eliminados, ...eliminados];
    this.jogadores = this.jogadores.filter((jogador) => jogador.pontos > 0);
    this.ajustarEmbaralhadorAposEliminacao();
    eliminados.forEach((jogador) => {
      this.emitirJogadorEliminado(jogador);
    });
    return true;
  }

  private ajustarEmbaralhadorAposEliminacao(): void {
    if (this.jogadores.length === 0) {
      this.embaralhadorIndice = 0;
      return;
    }
    this.embaralhadorIndice %= this.jogadores.length;
  }

  private encerrarSeNecessario(): boolean {
    if (this.jogadores.length !== 1) return false;
    this.jogoEncerrado = true;
    this.rodada = undefined;
    this.emitirJogoEncerrado();
    return true;
  }

  private emitirJogadorEliminado(jogador: Jogador): void {
    this.emissor.emit({ ...criarEventoBase(), tipo: 'JOGADOR_ELIMINADO', jogador });
  }

  private emitirRodadaIniciada(cartasPorRodada: number): void {
    this.emissor.emit({
      ...criarEventoBase(),
      tipo: 'RODADA_INICIADA',
      numeroRodada: this.numeroRodada,
      cartasPorRodada,
      embaralhadorId: this.embaralhadorAtual().id,
      jogadoresAtivos: this.jogadoresAtivos(),
    });
  }

  private rotacionarEmbaralhador(): void {
    this.embaralhadorIndice = (this.embaralhadorIndice + 1) % this.jogadores.length;
  }

  private embaralhadorAtual(): Jogador {
    return this.jogadores[this.embaralhadorIndice];
  }

  private jogadoresAtivos(): string[] {
    return this.jogadores.map((jogador) => jogador.id);
  }

  private emitirJogoEncerrado(): void {
    this.emissor.emit({
      ...criarEventoBase(),
      tipo: 'JOGO_ENCERRADO',
      classificacao: [...this.jogadores, ...this.eliminados].sort((a, b) => b.pontos - a.pontos),
    });
  }
}
