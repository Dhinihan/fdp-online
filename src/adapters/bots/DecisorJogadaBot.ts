import type { Carta } from '@/core/Carta';
import type { DecisorJogada } from '@/core/portas/DecisorJogada';
import type { GeradorAleatorio } from '@/core/RngComSeed';
import { estadoEmJogo, type EstadoRodada } from '@/types/estado-rodada';
import { criarCaminhoJogadaDebug } from './debug-jogada-bot';
import { decidirAbertura } from './decidirAbertura';
import { DecisorJogadaLinhaQuente } from './DecisorJogadaLinhaQuente';
import type { LoggerDebugBot } from './logger-debug-bot';
import { registrarEscolhaDireta } from './registrar-decisao-jogada-bot';

interface ConfigDecisorJogadaBot {
  temperatura: number;
  rng: Pick<GeradorAleatorio, 'random'>;
  liderBaixa?: number;
  liderAlta?: number;
  urgenciaAbrirForte?: number;
  logger?: LoggerDebugBot;
}

export class DecisorJogadaBot implements DecisorJogada {
  private readonly quente: DecisorJogadaLinhaQuente;
  private readonly temperatura: number;
  private readonly urgenciaAbrirForte: number;
  private readonly logger?: LoggerDebugBot;

  constructor(config: ConfigDecisorJogadaBot) {
    this.temperatura = config.temperatura;
    this.urgenciaAbrirForte = config.urgenciaAbrirForte ?? 0.5;
    this.quente = new DecisorJogadaLinhaQuente(config);
    this.logger = config.logger;
  }

  async decidirJogada(mao: Carta[], estado: EstadoRodada): Promise<Carta> {
    if (mao.length === 0) return Promise.reject(new Error('Mão vazia'));

    const estadoAtual = estadoEmJogo(estado);
    if (estadoAtual.mesa.length === 0) {
      const carta = decidirAbertura(mao, estadoAtual, {
        temperatura: this.temperatura,
        urgenciaAbrirForte: this.urgenciaAbrirForte,
      });
      return registrarEscolhaDireta({
        logger: this.logger,
        mao,
        estado,
        carta,
        linhaFria: carta,
        linhaQuente: carta,
        motivoLinhaFria: 'abertura: árvore de abertura',
        motivoLinhaQuente: 'abertura: segue linha fria',
        caminhoLinhaFria: criarCaminhoJogadaDebug('abre', 'fria'),
        caminhoLinhaQuente: criarCaminhoJogadaDebug('abre', 'quente'),
        escolheuQuente: false,
      });
    }

    return this.quente.decidirJogada(mao, estado);
  }
}
