import type { Jogador } from '@/types/entidades';
import type { EstadoEmJogo, EstadoMutavel, EstadoRodada, FaseRodada } from '@/types/estado-rodada';
import { criarBaralho, distribuir, embaralhar } from './Baralho';
import { obterProximoValor } from './Carta';
import type { Carta } from './Carta';
import { criarMaosRodada } from './criar-maos-rodada';
import type { DecisoresRodada } from './decisores-rodada';
import {
  emitirCartaJogada,
  emitirDeclaracaoFeita,
  emitirManilhaVirada,
  emitirPontuacaoAplicada,
  emitirRodadaEncerrada,
  emitirTurnoEmpatado,
  emitirTurnoGanho,
  type EmissorRodada,
} from './eventos-rodada';
import { validarTransicaoFase } from './maquina-fases';
import { aplicarPontuacao } from './pontuacao';
import type { DecisorDeclaracao } from './portas/DecisorDeclaracao';
import type { DecisorJogada } from './portas/DecisorJogada';
import { calcularResultadoTurno } from './resultado-turno';
import { criarSnapshotEstadoRodada } from './snapshot-estado-rodada';
export class Rodada {
  private _estado: EstadoMutavel;
  private decisores: Map<string, DecisorJogada>;
  private decisoresDeclaracao: Map<string, DecisorDeclaracao>;
  private emissor: EmissorRodada;
  private jogadores: Jogador[];
  private numeroRodada: number;
  constructor(jogadores: Jogador[], emissor: EmissorRodada, decisores: DecisoresRodada) {
    this.jogadores = jogadores;
    this.decisores = decisores.jogada;
    this.decisoresDeclaracao = decisores.declaracao;
    this.emissor = emissor;
    this.numeroRodada = decisores.numeroRodada ?? 1;
    this._estado = {
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
      pontos: Object.fromEntries(jogadores.map((jogador) => [jogador.id, jogador.pontos])),
    };
  }
  get estado(): EstadoRodada {
    return criarSnapshotEstadoRodada(this._estado);
  }
  distribuir(numeroCartas: number, baralhoEntrada?: Carta[]): void {
    const baralho = baralhoEntrada ?? embaralhar(criarBaralho());
    const precisaDistribuir = numeroCartas * this.jogadores.length;
    const cartaVirada = baralho.length > precisaDistribuir ? baralho[0] : null;
    const baralhoRestante = cartaVirada ? baralho.slice(1) : baralho;
    const manilha = cartaVirada ? obterProximoValor(cartaVirada.valor) : '3';
    const cartas = distribuir(baralhoRestante, numeroCartas, this.jogadores.length);
    this.atualizarEstadoDistribuido({ numeroCartas, cartaVirada, manilha, cartas });
    this.transitarFase('aguardandoDeclaracao');
    if (cartaVirada) emitirManilhaVirada(this.emissor, cartaVirada, manilha);
  }
  async declarar(): Promise<void> {
    const estado = this.estado;
    if (estado.fase !== 'aguardandoDeclaracao') throw new Error(`Não é possível declarar na fase ${estado.fase}`);
    this.transitarFase('processandoDeclaracao');
    const jogador = this.jogadores[this._estado.jogadorAtual];
    const decisor = this.decisoresDeclaracao.get(jogador.id);
    if (!decisor) {
      this.transitarFase('aguardandoDeclaracao');
      throw new Error(`Decisor de declaração não encontrado para jogador ${jogador.id}`);
    }
    try {
      const declaracao = await decisor.declarar(estado, this._estado.maos[this._estado.jogadorAtual].cartas);
      this.validarDeclaracao(declaracao);
      this._estado.declaracoes[jogador.id] = declaracao;
      emitirDeclaracaoFeita(this.emissor, jogador.id, declaracao);
      this.avancarDeclaracao();
    } catch (erro) {
      if (this._estado.fase === 'processandoDeclaracao') this.transitarFase('aguardandoDeclaracao');
      throw erro;
    }
  }
  async jogarTurno(): Promise<void> {
    const estado = this.estado;
    if (estado.fase !== 'aguardandoJogada') throw new Error(`Não é possível jogar na fase ${estado.fase}`);
    this.transitarFase('processandoTurno');
    const jogador = this.jogadores[this._estado.jogadorAtual];
    const decisor = this.decisores.get(jogador.id);
    if (!decisor) {
      this.transitarFase('aguardandoJogada');
      throw new Error(`Decisor não encontrado para jogador ${jogador.id}`);
    }
    try {
      await this.executarJogada(jogador, decisor, estado);
    } catch (erro) {
      if (this._estado.fase === 'processandoTurno') this.transitarFase('aguardandoJogada');
      throw erro;
    }
  }
  private atualizarEstadoDistribuido(config: DistribuicaoConfig): void {
    this._estado.maos = criarMaosRodada(this.jogadores, config.cartas, this.numeroRodada === 1);
    this._estado.cartasPorRodada = config.numeroCartas;
    this._estado.manilha = config.manilha;
    this._estado.cartaVirada = config.cartaVirada;
    this._estado.declaracoes = {};
    this._estado.mesa = [];
    this._estado.vazas = {};
    this._estado.turno = 1;
  }
  private validarDeclaracao(declaracao: number): void {
    const maximo = this._estado.cartasPorRodada;
    if (!Number.isInteger(declaracao) || declaracao < 0 || declaracao > maximo) {
      throw new Error(`Declaração inválida: ${String(declaracao)}`);
    }
  }
  private avancarDeclaracao(): void {
    const totalDeclaracoes = Object.keys(this._estado.declaracoes).length;
    if (totalDeclaracoes === this.jogadores.length) {
      this.transitarFase('aguardandoJogada');
      this._estado.jogadorAtual = 0;
      return;
    }
    this._estado.jogadorAtual = (this._estado.jogadorAtual + 1) % this.jogadores.length;
    this.transitarFase('aguardandoDeclaracao');
  }
  private async executarJogada(jogador: Jogador, decisor: DecisorJogada, estado: EstadoEmJogo): Promise<void> {
    const mao = this._estado.maos[this._estado.jogadorAtual].cartas;
    const carta = await decisor.decidirJogada(mao, estado);
    const indiceCarta = mao.findIndex((c) => c.valor === carta.valor && c.naipe === carta.naipe);
    if (indiceCarta === -1) throw new Error(`Jogada inválida para jogador ${jogador.id}`);
    this._estado.maos[this._estado.jogadorAtual].cartas = [...mao.slice(0, indiceCarta), ...mao.slice(indiceCarta + 1)];
    this._estado.mesa.push({ jogadorId: jogador.id, carta });
    emitirCartaJogada(this.emissor, { jogadorId: jogador.id, carta, posicaoMesa: this._estado.mesa.length - 1 });
    this.avancarJogador();
  }
  private avancarJogador(): void {
    if (this._estado.mesa.length === this.jogadores.length) {
      this.resolverTurno();
      return;
    }
    this._estado.jogadorAtual = (this._estado.jogadorAtual + 1) % this.jogadores.length;
    this.transitarFase('aguardandoJogada');
  }

  private resolverTurno(): void {
    const resultado = calcularResultadoTurno(this._estado.mesa, this._estado.manilha, this.jogadores);
    const proximoJogadorId = this.processarResultadoTurno(resultado);
    this._estado.turno += 1;
    this._estado.mesa = [];
    if (this._estado.turno > this._estado.cartasPorRodada) this.concluirRodada();
    else this.iniciarProximoTurno(proximoJogadorId);
  }

  private processarResultadoTurno(resultado: ReturnType<typeof calcularResultadoTurno>): string {
    if (resultado.tipo === 'vitoria') {
      this._estado.vazas[resultado.jogador.id] = (this._estado.vazas[resultado.jogador.id] ?? 0) + 1;
      emitirTurnoGanho(this.emissor, resultado.jogador.id, this.cartasDaMesa());
      return resultado.jogador.id;
    }
    emitirTurnoEmpatado(this.emissor, resultado.ultimoEmpatado.id, this.cartasDaMesa());
    return resultado.ultimoEmpatado.id;
  }

  private concluirRodada(): void {
    this.transitarFase('rodadaConcluida');
    const pontos = aplicarPontuacao(
      this._estado,
      this.jogadores.map((j) => j.id),
    );
    emitirPontuacaoAplicada(this.emissor, pontos.pontos, pontos.penalidades);
    emitirRodadaEncerrada(this.emissor, { ...this._estado.vazas });
  }

  private iniciarProximoTurno(proximoJogadorId: string): void {
    this.transitarFase('aguardandoJogada');
    this._estado.jogadorAtual = this.jogadores.findIndex((j) => j.id === proximoJogadorId);
  }

  private transitarFase(novaFase: FaseRodada): void {
    validarTransicaoFase(this._estado.fase, novaFase);
    this._estado.fase = novaFase;
  }

  private cartasDaMesa(): Carta[] {
    return this._estado.mesa.map((m) => m.carta);
  }
}

interface DistribuicaoConfig {
  numeroCartas: number;
  cartaVirada: Carta | null;
  manilha: Carta['valor'];
  cartas: Carta[][];
}
