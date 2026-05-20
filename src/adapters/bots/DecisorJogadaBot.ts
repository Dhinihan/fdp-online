import type { Carta } from '@/core/Carta';
import type { DecisorJogada } from '@/core/portas/DecisorJogada';
import type { GeradorAleatorio } from '@/core/RngComSeed';
import { estadoEmJogo, type EstadoRodada } from '@/types/estado-rodada';
import { decidirAbertura } from './decidirAbertura';
import { DecisorJogadaLinhaQuente } from './DecisorJogadaLinhaQuente';

interface ConfigDecisorJogadaBot {
  temperatura: number;
  rng: Pick<GeradorAleatorio, 'random'>;
  liderBaixa?: number;
  liderAlta?: number;
  urgenciaAbrirForte?: number;
}

export class DecisorJogadaBot implements DecisorJogada {
  private readonly quente: DecisorJogadaLinhaQuente;
  private readonly temperatura: number;
  private readonly urgenciaAbrirForte: number;

  constructor(config: ConfigDecisorJogadaBot) {
    this.temperatura = config.temperatura;
    this.urgenciaAbrirForte = config.urgenciaAbrirForte ?? 0.5;
    this.quente = new DecisorJogadaLinhaQuente(config);
  }

  async decidirJogada(mao: Carta[], estado: EstadoRodada): Promise<Carta> {
    if (mao.length === 0) return Promise.reject(new Error('Mão vazia'));

    const estadoAtual = estadoEmJogo(estado);
    if (estadoAtual.mesa.length === 0) {
      return decidirAbertura(mao, estadoAtual, {
        temperatura: this.temperatura,
        urgenciaAbrirForte: this.urgenciaAbrirForte,
      });
    }

    return this.quente.decidirJogada(mao, estado);
  }
}
