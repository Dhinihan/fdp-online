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
}

interface Bifurcacao {
  logger?: LoggerDebugBot;
  temperatura: number;
  mao: Carta[];
  estado: EstadoRodada;
  fria: Carta;
  quente: Carta;
  motivoLinhaFria?: string;
  motivoLinhaQuente?: string;
  caminhoLinhaFria: string[];
  caminhoLinhaQuente: string[];
  sorteio: number;
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
    contexto: criarContextoJogadaDebug(config.estado, config.mao.length),
    fria: criarLinhaJogadaDebug(config.fria, config.motivoLinhaFria, config.caminhoLinhaFria),
    quente: criarLinhaJogadaDebug(config.quente, config.motivoLinhaQuente, config.caminhoLinhaQuente),
    motivoLinhaFria: config.motivoLinhaFria,
    motivoLinhaQuente: config.motivoLinhaQuente,
    carta,
    escolheuQuente,
    sorteio: config.sorteio,
  });
  return carta;
}
