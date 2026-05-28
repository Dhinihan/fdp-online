import type { Carta } from '@/core/Carta';
import type { DecisorJogada } from '@/core/portas/DecisorJogada';
import type { GeradorAleatorio } from '@/core/RngComSeed';
import { estadoEmJogo, type EstadoEmJogo, type EstadoRodada } from '@/types/estado-rodada';
import { decidirAberturaLinhaFria, decidirAberturaLinhaQuente } from './decidirAbertura';
import { DecisorJogadaLinhaQuente } from './DecisorJogadaLinhaQuente';
import type { LoggerDebugBot } from './logger-debug-bot';
import { registrarEscolhaDireta } from './registrar-decisao-jogada-bot';

interface ConfigDecisorJogadaBot {
  temperatura: number;
  rng: Pick<GeradorAleatorio, 'random'>;
  liderBaixa?: number;
  liderAlta?: number;
  logger?: LoggerDebugBot;
}

export class DecisorJogadaBot implements DecisorJogada {
  private readonly quente: DecisorJogadaLinhaQuente;
  private readonly logger?: LoggerDebugBot;

  constructor(config: ConfigDecisorJogadaBot) {
    this.quente = new DecisorJogadaLinhaQuente(config);
    this.logger = config.logger;
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
    return registrarEscolhaDireta({
      logger: this.logger,
      mao,
      estado,
      carta: fria.carta,
      linhaFria: fria.carta,
      linhaQuente: quente.carta,
      motivoLinhaFria: fria.motivo,
      motivoLinhaQuente: quente.motivo,
      caminhoLinhaFria: fria.caminho,
      caminhoLinhaQuente: quente.caminho,
      escolheuQuente: false,
    });
  }
}
