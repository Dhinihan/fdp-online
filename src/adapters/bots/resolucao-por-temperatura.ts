import type { Carta } from '@/core/Carta';
import type { GeradorAleatorio } from '@/core/RngComSeed';
import type { EstadoRodada } from '@/types/estado-rodada';
import type { LoggerDebugBot } from './logger-debug-bot';
import { registrarEscolhaDireta } from './registrar-decisao-jogada-bot';
import { cartasIguais } from './regras-linha-quente';

export interface RecomendacaoLinha {
  carta: Carta;
  motivo: string;
  caminho: string[];
}

export interface ConfigResolucao {
  logger?: LoggerDebugBot;
  temperatura: number;
  rng: Pick<GeradorAleatorio, 'random'>;
  mao: Carta[];
  estado: EstadoRodada;
  fria: RecomendacaoLinha;
  quente: RecomendacaoLinha;
}

export function resolverPorTemperatura(config: ConfigResolucao): Carta {
  if (cartasIguais(config.fria.carta, config.quente.carta)) {
    return registrarEscolhaDireta(criarRegistro(config, config.fria.carta, false));
  }

  const sorteio = config.rng.random();
  const escolheuQuente = sorteio < config.temperatura;
  const carta = escolheuQuente ? config.quente.carta : config.fria.carta;
  return registrarEscolhaDireta({ ...criarRegistro(config, carta, escolheuQuente), sorteio });
}

function criarRegistro(config: ConfigResolucao, carta: Carta, escolheuQuente: boolean) {
  return {
    logger: config.logger,
    mao: config.mao,
    estado: config.estado,
    carta,
    linhaFria: config.fria.carta,
    linhaQuente: config.quente.carta,
    motivoLinhaFria: config.fria.motivo,
    motivoLinhaQuente: config.quente.motivo,
    caminhoLinhaFria: config.fria.caminho,
    caminhoLinhaQuente: config.quente.caminho,
    escolheuQuente,
  };
}
