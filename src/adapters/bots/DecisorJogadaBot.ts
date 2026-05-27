import type { Carta } from '@/core/Carta';
import type { DecisorJogada } from '@/core/portas/DecisorJogada';
import type { GeradorAleatorio } from '@/core/RngComSeed';
import { estadoEmJogo, type EstadoRodada } from '@/types/estado-rodada';
import { criarCaminhoJogadaDebug } from './debug-jogada-bot';
import { decidirAberturaLinhaFria } from './decidirAbertura';
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
      const fria = decidirAberturaLinhaFria(mao, estadoAtual);
      return registrarEscolhaDireta({
        logger: this.logger,
        mao,
        estado,
        carta: fria.carta,
        linhaFria: fria.carta,
        linhaQuente: fria.carta,
        motivoLinhaFria: fria.motivo,
        motivoLinhaQuente: 'abertura: segue linha fria',
        caminhoLinhaFria: fria.caminho,
        caminhoLinhaQuente: criarCaminhoJogadaDebug('abre', 'quente'),
        escolheuQuente: false,
      });
    }

    return this.quente.decidirJogada(mao, estado);
  }
}
