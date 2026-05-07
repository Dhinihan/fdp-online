import type { Jogador } from '@/types/entidades';
import type { EstadoRodada } from '@/types/estado-rodada';
import { criarBaralho, distribuir, embaralhar } from './Baralho';
import { obterProximoValor } from './Carta';
import type { Carta } from './Carta';
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
import { aplicarPontuacao } from './pontuacao';
import type { DecisorDeclaracao } from './portas/DecisorDeclaracao';
import type { DecisorJogada } from './portas/DecisorJogada';
import { calcularResultadoTurno } from './resultado-turno';

export class Rodada {
  private _estado: EstadoRodada;
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
    return this._estado;
  }

  distribuir(numeroCartas: number, baralhoEntrada?: Carta[]): void {
    const baralho = baralhoEntrada ?? embaralhar(criarBaralho());
    const precisaDistribuir = numeroCartas * this.jogadores.length;
    const cartaVirada = baralho.length > precisaDistribuir ? baralho[0] : null;
    const baralhoRestante = cartaVirada ? baralho.slice(1) : baralho;
    const manilha = cartaVirada ? obterProximoValor(cartaVirada.valor) : '3';

    const cartas = distribuir(baralhoRestante, numeroCartas, this.jogadores.length);
    const primeiraRodada = this.numeroRodada === 1;
    this._estado.maos = this.jogadores.map((jogador, i) => ({
      jogador,
      cartas: cartas[i],
      visivel: primeiraRodada ? jogador.id !== 'humano' : jogador.id === 'humano',
    }));
    this._estado.cartasPorRodada = numeroCartas;
    this._estado.manilha = manilha;
    this._estado.cartaVirada = cartaVirada;
    this._estado.declaracoes = {};
    this._estado.fase = 'aguardandoDeclaracao';

    if (cartaVirada) emitirManilhaVirada(this.emissor, cartaVirada, manilha);
  }

  async declarar(): Promise<void> {
    if (this._estado.fase !== 'aguardandoDeclaracao') {
      throw new Error(`Não é possível declarar na fase ${this._estado.fase}`);
    }
    this._estado.fase = 'processandoDeclaracao';
    const jogador = this.jogadores[this._estado.jogadorAtual];
    const decisor = this.decisoresDeclaracao.get(jogador.id);
    if (!decisor) {
      this._estado.fase = 'aguardandoDeclaracao';
      throw new Error(`Decisor de declaração não encontrado para jogador ${jogador.id}`);
    }
    try {
      const declaracao = await decisor.declarar(this._estado, this._estado.maos[this._estado.jogadorAtual].cartas);
      this.validarDeclaracao(declaracao);
      this._estado.declaracoes[jogador.id] = declaracao;
      emitirDeclaracaoFeita(this.emissor, jogador.id, declaracao);
      this.avancarDeclaracao();
    } catch (erro) {
      this._estado.fase = 'aguardandoDeclaracao';
      throw erro;
    }
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
      this._estado.fase = 'aguardandoJogada';
      this._estado.jogadorAtual = 0;
    } else {
      this._estado.jogadorAtual = (this._estado.jogadorAtual + 1) % this.jogadores.length;
      this._estado.fase = 'aguardandoDeclaracao';
    }
  }

  async jogarTurno(): Promise<void> {
    if (this._estado.fase !== 'aguardandoJogada') {
      throw new Error(`Não é possível jogar na fase ${this._estado.fase}`);
    }
    this._estado.fase = 'processandoTurno';
    const jogador = this.jogadores[this._estado.jogadorAtual];
    const decisor = this.decisores.get(jogador.id);
    if (!decisor) {
      this._estado.fase = 'aguardandoJogada';
      throw new Error(`Decisor não encontrado para jogador ${jogador.id}`);
    }
    try {
      await this.executarJogada(jogador, decisor);
    } catch (erro) {
      this._estado.fase = 'aguardandoJogada';
      throw erro;
    }
  }

  private async executarJogada(jogador: Jogador, decisor: DecisorJogada): Promise<void> {
    const mao = this._estado.maos[this._estado.jogadorAtual].cartas;
    const carta = await decisor.decidirJogada(mao, this._estado);
    const indiceCarta = mao.findIndex((c) => c.valor === carta.valor && c.naipe === carta.naipe);
    if (indiceCarta === -1) throw new Error(`Jogada inválida para jogador ${jogador.id}`);
    this._estado.maos[this._estado.jogadorAtual].cartas = [...mao.slice(0, indiceCarta), ...mao.slice(indiceCarta + 1)];
    this._estado.mesa.push({ jogadorId: jogador.id, carta });
    emitirCartaJogada(this.emissor, {
      jogadorId: jogador.id,
      carta,
      posicaoMesa: this._estado.mesa.length - 1,
    });
    this.avancarJogador();
  }

  private avancarJogador(): void {
    if (this._estado.mesa.length === this.jogadores.length) {
      this.resolverTurno();
      return;
    }
    this._estado.jogadorAtual = (this._estado.jogadorAtual + 1) % this.jogadores.length;
    this._estado.fase = 'aguardandoJogada';
  }

  private resolverTurno(): void {
    const resultado = calcularResultadoTurno(this._estado.mesa, this._estado.manilha, this.jogadores);
    let proximoJogadorId: string;
    if (resultado.tipo === 'vitoria') {
      this._estado.vazas[resultado.jogador.id] = (this._estado.vazas[resultado.jogador.id] ?? 0) + 1;
      emitirTurnoGanho(this.emissor, resultado.jogador.id, this.cartasDaMesa());
      proximoJogadorId = resultado.jogador.id;
    } else {
      emitirTurnoEmpatado(this.emissor, resultado.ultimoEmpatado.id, this.cartasDaMesa());
      proximoJogadorId = resultado.ultimoEmpatado.id;
    }
    this._estado.turno += 1;
    this._estado.mesa = [];
    if (this._estado.turno > this._estado.cartasPorRodada) {
      this._estado.fase = 'rodadaConcluida';
      const pontos = aplicarPontuacao(
        this._estado,
        this.jogadores.map((j) => j.id),
      );
      emitirPontuacaoAplicada(this.emissor, pontos.pontos, pontos.penalidades);
      emitirRodadaEncerrada(this.emissor, { ...this._estado.vazas });
    } else {
      this._estado.fase = 'aguardandoJogada';
      this._estado.jogadorAtual = this.jogadores.findIndex((j) => j.id === proximoJogadorId);
    }
  }

  private cartasDaMesa(): Carta[] {
    return this._estado.mesa.map((m) => m.carta);
  }
}
