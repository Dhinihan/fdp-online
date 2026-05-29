import type { Carta } from '@/core/Carta';
import type { EstadoRodada } from '@/types/estado-rodada';
import { criarContextoJogadaDebug, criarLinhaJogadaDebug } from './debug-jogada-bot';
import type { LoggerDebugBot } from './logger-debug-bot';

interface EscolhaDireta {
  logger?: LoggerDebugBot;
  mao: Carta[];
  estado: EstadoRodada;
  carta: Carta;
  linhaFria?: Carta;
  linhaQuente?: Carta;
  motivoLinhaFria?: string;
  motivoLinhaQuente?: string;
  caminhoLinhaFria: string[];
  caminhoLinhaQuente: string[];
  escolheuQuente: boolean;
  sorteio?: number;
}

export function registrarEscolhaDireta(config: EscolhaDireta): Carta {
  config.logger?.registrarJogada({
    mao: config.mao,
    estado: config.estado,
    linhaFria: config.linhaFria ?? config.carta,
    linhaQuente: config.linhaQuente ?? config.carta,
    contexto: criarContextoJogadaDebug(config.estado, config.mao.length),
    fria: criarLinhaJogadaDebug(config.linhaFria ?? config.carta, config.motivoLinhaFria, config.caminhoLinhaFria),
    quente: criarLinhaJogadaDebug(
      config.linhaQuente ?? config.carta,
      config.motivoLinhaQuente,
      config.caminhoLinhaQuente,
    ),
    motivoLinhaFria: config.motivoLinhaFria,
    motivoLinhaQuente: config.motivoLinhaQuente,
    carta: config.carta,
    escolheuQuente: config.escolheuQuente,
    sorteio: config.sorteio,
  });
  return config.carta;
}
