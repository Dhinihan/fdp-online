import type { Carta } from '@/core/Carta';
import type { EstadoRodada } from '@/types/estado-rodada';
import type { LoggerDebugBot } from './logger-debug-bot';

interface EscolhaDireta {
  logger?: LoggerDebugBot;
  mao: Carta[];
  estado: EstadoRodada;
  carta: Carta;
  escolheuQuente: boolean;
}

interface Bifurcacao {
  logger?: LoggerDebugBot;
  temperatura: number;
  mao: Carta[];
  estado: EstadoRodada;
  fria: Carta;
  quente: Carta;
  sorteio: number;
}

export function registrarEscolhaDireta(config: EscolhaDireta): Carta {
  config.logger?.registrarJogada({
    mao: config.mao,
    estado: config.estado,
    linhaFria: config.carta,
    linhaQuente: config.carta,
    carta: config.carta,
    escolheuQuente: config.escolheuQuente,
  });
  return config.carta;
}

export function registrarBifurcacao(config: Bifurcacao): Carta {
  const escolheuQuente = config.sorteio < config.temperatura;
  const carta = escolheuQuente ? config.quente : config.fria;
  config.logger?.registrarJogada({
    mao: config.mao,
    estado: config.estado,
    linhaFria: config.fria,
    linhaQuente: config.quente,
    carta,
    escolheuQuente,
    sorteio: config.sorteio,
  });
  return carta;
}
