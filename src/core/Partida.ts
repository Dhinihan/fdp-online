import type { Jogador } from '@/types/entidades';
import type { EstadoPartida } from '@/types/estado-partida';
import type { EventoDominio } from '@/types/eventos-dominio';
import { criarBaralho, distribuir, embaralhar } from './Baralho';
import { compararNaipe, compararValor } from './Carta';
import type { Carta } from './Carta';
import type { DecisorJogada } from './portas/DecisorJogada';

interface Emissor {
  emit(evento: EventoDominio): void;
}

export class Partida {
  private _estado: EstadoPartida;
  private decisores: Map<string, DecisorJogada>;
  private emissor: Emissor;
  private jogadores: Jogador[];

  constructor(jogadores: Jogador[], decisores: Map<string, DecisorJogada>, emissor: Emissor) {
    this.jogadores = jogadores;
    this.decisores = decisores;
    this.emissor = emissor;
    this._estado = {
      fase: 'distribuindo',
      jogadorAtual: 0,
      mesa: [],
      maos: [],
      vazas: {},
      turno: 1,
      cartasPorRodada: 0,
    };
  }

  get estado(): EstadoPartida {
    return this._estado;
  }

  distribuir(numeroCartas: number): void {
    const baralho = embaralhar(criarBaralho());
    const cartas = distribuir(baralho, numeroCartas, this.jogadores.length);
    this._estado.maos = this.jogadores.map((jogador, i) => ({
      jogador,
      cartas: cartas[i],
      visivel: jogador.id === 'humano',
    }));
    this._estado.cartasPorRodada = numeroCartas;
    this._estado.fase = 'aguardandoJogada';
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
    if (indiceCarta === -1) {
      throw new Error(`Jogada inválida para jogador ${jogador.id}`);
    }
    this.removerCartaDaMao(indiceCarta);
    this._estado.mesa.push({ jogadorId: jogador.id, carta });
    this.emitirCartaJogada(jogador, carta);
    this.avancarJogador();
  }

  private removerCartaDaMao(indice: number): void {
    const mao = this._estado.maos[this._estado.jogadorAtual].cartas;
    this._estado.maos[this._estado.jogadorAtual].cartas = [...mao.slice(0, indice), ...mao.slice(indice + 1)];
  }

  private emitirCartaJogada(jogador: Jogador, carta: Carta): void {
    this.emissor.emit({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      tipo: 'CARTA_JOGADA',
      jogadorId: jogador.id,
      carta,
      posicaoMesa: this._estado.mesa.length - 1,
    });
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
    this.emitirTurnoGanho(vencedor);
    this._estado.turno += 1;
    this._estado.mesa = [];

    if (this._estado.turno > this._estado.cartasPorRodada) {
      this._estado.fase = 'rodadaConcluida';
      this.emitirRodadaEncerrada();
    } else {
      this._estado.fase = 'aguardandoJogada';
      this._estado.jogadorAtual = this.jogadores.findIndex((j) => j.id === vencedor.id);
    }
  }

  private calcularVencedorTurno(): Jogador {
    let indiceMelhor = 0;
    for (let i = 1; i < this._estado.mesa.length; i++) {
      const cartaAtual = this._estado.mesa[i].carta;
      const cartaMelhor = this._estado.mesa[indiceMelhor].carta;
      if (compararValor(cartaAtual, cartaMelhor)) {
        indiceMelhor = i;
      } else if (!compararValor(cartaMelhor, cartaAtual) && compararNaipe(cartaAtual, cartaMelhor)) {
        indiceMelhor = i;
      }
    }
    const jogadorId = this._estado.mesa[indiceMelhor].jogadorId;
    const vencedor = this.jogadores.find((j) => j.id === jogadorId);
    if (!vencedor) throw new Error('Vencedor não encontrado');
    return vencedor;
  }

  private emitirTurnoGanho(vencedor: Jogador): void {
    this.emissor.emit({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      tipo: 'TURNO_GANHO',
      jogadorId: vencedor.id,
      cartas: this._estado.mesa.map((m) => m.carta),
    });
  }

  private emitirRodadaEncerrada(): void {
    this.emissor.emit({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      tipo: 'RODADA_ENCERRADA',
      placar: { ...this._estado.vazas },
      proximaRodada: null,
    });
  }
}
