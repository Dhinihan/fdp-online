import type { Carta } from '@/core/Carta';
import type { DecisorJogada } from '@/core/portas/DecisorJogada';
import type { GeradorAleatorio } from '@/core/RngComSeed';
import { estadoEmJogo, type EstadoEmJogo, type EstadoRodada } from '@/types/estado-rodada';
import { decidirAberturaLinhaFria, decidirAberturaLinhaQuente } from './decidirAbertura';
import { DecisorJogadaLinhaQuente } from './DecisorJogadaLinhaQuente';
import type { LoggerDebugBot } from './logger-debug-bot';
import { resolverPorTemperatura } from './resolucao-por-temperatura';

interface ConfigDecisorJogadaBot {
  temperatura: number;
  rng: Pick<GeradorAleatorio, 'random'>;
  liderBaixa?: number;
  logger?: LoggerDebugBot;
}

export class DecisorJogadaBot implements DecisorJogada {
  private readonly quente: DecisorJogadaLinhaQuente;
  private readonly logger?: LoggerDebugBot;
  private readonly temperatura: number;
  private readonly rng: Pick<GeradorAleatorio, 'random'>;

  constructor(config: ConfigDecisorJogadaBot) {
    this.quente = new DecisorJogadaLinhaQuente(config);
    this.logger = config.logger;
    this.temperatura = config.temperatura;
    this.rng = config.rng;
  }

  async decidirJogada(mao: Carta[], estado: EstadoRodada): Promise<Carta> {
    if (mao.length === 0) return Promise.reject(new Error('Mão vazia'));

    const estadoAtual = estadoEmJogo(estado);
    if (estadoAtual.mesa.length === 0) {
      return this.decidirAbertura(mao, estado, estadoAtual);
    }

    return this.quente.decidirJogada(mao, estado);
  }

  private decidirAbertura(mao: Carta[], estado: EstadoRodada, estadoAtual: EstadoEmJogo): Carta {
    const fria = decidirAberturaLinhaFria(mao, estadoAtual);
    const quente = decidirAberturaLinhaQuente(fria);
    return resolverPorTemperatura({
      logger: this.logger,
      temperatura: this.temperatura,
      rng: this.rng,
      mao,
      estado,
      fria,
      quente,
    });
  }
}
