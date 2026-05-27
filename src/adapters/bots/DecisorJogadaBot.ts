import type { Carta } from '@/core/Carta';
import type { DecisorJogada } from '@/core/portas/DecisorJogada';
import type { GeradorAleatorio } from '@/core/RngComSeed';
import { estadoEmJogo, type EstadoRodada } from '@/types/estado-rodada';
import { criarContextoJogadaDebug, criarLinhaJogadaDebug } from './debug-jogada-bot';
import { decidirAbertura } from './decidirAbertura';
import { DecisorJogadaLinhaQuente } from './DecisorJogadaLinhaQuente';
import type { LoggerDebugBot } from './logger-debug-bot';

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
      this.logger?.registrarJogada({
        estado,
        mao,
        linhaFria: carta,
        linhaQuente: carta,
        contexto: criarContextoJogadaDebug(estado, mao.length),
        fria: criarLinhaJogadaDebug(carta, 'abertura: árvore de abertura', ['jogada', 'abre a mesa', 'linha fria']),
        quente: criarLinhaJogadaDebug(carta, 'abertura: segue linha fria', ['jogada', 'abre a mesa', 'linha quente']),
        carta,
        escolheuQuente: false,
      });
      return carta;
    }

    return this.quente.decidirJogada(mao, estado);
  }
}
