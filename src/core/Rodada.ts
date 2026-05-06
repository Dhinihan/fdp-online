import type { Jogador } from '@/types/entidades';
import type { EstadoRodada } from '@/types/estado-rodada';
import type { EventoDominio } from '@/types/eventos-dominio';
import { criarBaralho, distribuir, embaralhar } from './Baralho';
import { obterProximoValor } from './Carta';
import type { Carta } from './Carta';
import { calcularIndiceVencedor } from './comparador-carta';
import type { DecisorDeclaracao } from './portas/DecisorDeclaracao';
import type { DecisorJogada } from './portas/DecisorJogada';

interface Emissor {
  emit(evento: EventoDominio): void;
}

export class Rodada {
  private _estado: EstadoRodada;
  private decisores: Map<string, DecisorJogada>;
  private decisoresDeclaracao: Map<string, DecisorDeclaracao>;
  private emissor: Emissor;
  private jogadores: Jogador[];

  constructor(
    jogadores: Jogador[],
    emissor: Emissor,
    decisores: {
      jogada: Map<string, DecisorJogada>;
      declaracao: Map<string, DecisorDeclaracao>;
    },
  ) {
    this.jogadores = jogadores;
    this.decisores = decisores.jogada;
    this.decisoresDeclaracao = decisores.declaracao;
    this.emissor = emissor;
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
    };
  }

  get estado(): EstadoRodada {
    return this._estado;
  }

  distribuir(numeroCartas: number, baralhoEntrada?: Carta[]): void {
    const baralho = baralhoEntrada ?? embaralhar(criarBaralho());
    const cartaVirada = baralho.length > 0 ? baralho[0] : null;
    const baralhoRestante = cartaVirada ? baralho.slice(1) : baralho;
    const manilha = cartaVirada ? obterProximoValor(cartaVirada.valor) : '3';

    const cartas = distribuir(baralhoRestante, numeroCartas, this.jogadores.length);
    this._estado.maos = this.jogadores.map((jogador, i) => ({
      jogador,
      cartas: cartas[i],
      visivel: jogador.id === 'humano',
    }));
    this._estado.cartasPorRodada = numeroCartas;
    this._estado.manilha = manilha;
    this._estado.cartaVirada = cartaVirada;
    this._estado.declaracoes = {};
    this._estado.fase = 'aguardandoDeclaracao';

    if (cartaVirada) {
      this.emissor.emit({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        tipo: 'MANILHA_VIRADA',
        cartaVirada,
        manilha,
      });
    }
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
      this._estado.declaracoes[jogador.id] = declaracao;
      this.emissor.emit({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        tipo: 'DECLARACAO_FEITA',
        jogadorId: jogador.id,
        declarado: declaracao,
      });
      this.avancarDeclaracao();
    } catch (erro) {
      this._estado.fase = 'aguardandoDeclaracao';
      throw erro;
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
    this.emissor.emit({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      tipo: 'CARTA_JOGADA',
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
    const vencedor = this.calcularVencedorTurno();
    this._estado.vazas[vencedor.id] = (this._estado.vazas[vencedor.id] ?? 0) + 1;
    this.emissor.emit({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      tipo: 'TURNO_GANHO',
      jogadorId: vencedor.id,
      cartas: this._estado.mesa.map((m) => m.carta),
    });
    this._estado.turno += 1;
    this._estado.mesa = [];
    if (this._estado.turno > this._estado.cartasPorRodada) {
      this._estado.fase = 'rodadaConcluida';
      this.emissor.emit({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        tipo: 'RODADA_ENCERRADA',
        placar: { ...this._estado.vazas },
        proximaRodada: null,
      });
    } else {
      this._estado.fase = 'aguardandoJogada';
      this._estado.jogadorAtual = this.jogadores.findIndex((j) => j.id === vencedor.id);
    }
  }

  private calcularVencedorTurno(): Jogador {
    const indiceMelhor = calcularIndiceVencedor(this._estado.mesa, this._estado.manilha);
    const jogadorId = this._estado.mesa[indiceMelhor].jogadorId;
    const vencedor = this.jogadores.find((j) => j.id === jogadorId);
    if (!vencedor) throw new Error('Vencedor não encontrado');
    return vencedor;
  }
}
