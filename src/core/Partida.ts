import type { Jogador } from '@/types/entidades';
import type { EstadoPartida } from '@/types/estado-partida';
import type { EventoDominio } from '@/types/eventos-dominio';
import { criarBaralho, distribuir, embaralhar } from './Baralho';
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
    this._estado.mesa.push(carta);
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
    this._estado.jogadorAtual = (this._estado.jogadorAtual + 1) % this.jogadores.length;
    if (this._estado.jogadorAtual === 0) {
      this._estado.fase = 'turnoConcluido';
    } else {
      this._estado.fase = 'aguardandoJogada';
    }
  }
}
