import type { Carta } from '@/core/Carta';
import type { DecisorJogada } from '@/core/portas/DecisorJogada';
import type { GeradorAleatorio } from '@/core/RngComSeed';
import { estadoEmJogo, type EstadoEmJogo, type EstadoRodada } from '@/types/estado-rodada';
import { criarCaminhoJogadaDebug, type PosicaoMesaJogadaDebug } from './debug-jogada-bot';
import { definirPosicao } from './debug-linha-quente';
import { decidirLinhaQuente, type ResultadoQuente } from './decidir-linha-quente';
import { decidirAberturaLinhaFria } from './decidirAbertura';
import { decidirNaoUltimoLinhaFria, decidirUltimoLinhaFria, type DecisaoLinhaFria } from './DecisorJogadaLinhaFria';
import { lerMesa, type LeituraDaMesa } from './ler-mesa';
import type { LoggerDebugBot } from './logger-debug-bot';
import { resolverPorTemperatura, type RecomendacaoLinha } from './resolucao-por-temperatura';

interface ConfigDecisorJogadaPorTemperatura {
  temperatura: number;
  rng: Pick<GeradorAleatorio, 'random'>;
  liderBaixa?: number;
  logger?: LoggerDebugBot;
}

export class DecisorJogadaPorTemperatura implements DecisorJogada {
  private readonly temperatura: number;
  private readonly rng: Pick<GeradorAleatorio, 'random'>;
  private readonly liderBaixa: number;
  private readonly logger?: LoggerDebugBot;

  constructor(config: ConfigDecisorJogadaPorTemperatura) {
    this.temperatura = config.temperatura;
    this.rng = config.rng;
    this.liderBaixa = config.liderBaixa ?? 8;
    this.logger = config.logger;
  }

  decidirJogada(mao: Carta[], estado: EstadoRodada): Promise<Carta> {
    if (mao.length === 0) return Promise.reject(new Error('Mão vazia'));

    const estadoAtual = estadoEmJogo(estado);
    const leitura = lerMesa(estadoAtual, mao);
    const posicao = definirPosicao(estadoAtual);
    const fria = decidirLinhaFriaPorPosicao(posicao, leitura, estadoAtual);
    const recomendacaoFria = montarRecomendacaoLinha(posicao, 'fria', fria);
    const quente = montarRecomendacaoQuente(
      posicao,
      decidirLinhaQuente({ posicao, estado: estadoAtual, leitura, liderBaixa: this.liderBaixa }),
      recomendacaoFria,
    );

    return Promise.resolve(
      resolverPorTemperatura({
        logger: this.logger,
        temperatura: this.temperatura,
        rng: this.rng,
        mao,
        estado,
        fria: recomendacaoFria,
        quente,
      }),
    );
  }
}

function decidirLinhaFriaPorPosicao(
  posicao: PosicaoMesaJogadaDebug,
  leitura: LeituraDaMesa,
  estadoAtual: EstadoEmJogo,
): DecisaoLinhaFria {
  if (posicao === 'abre') return decidirAberturaLinhaFria(leitura);
  if (posicao === 'fecha') return decidirUltimoLinhaFria(leitura, estadoAtual);
  return decidirNaoUltimoLinhaFria(leitura, estadoAtual);
}

function montarRecomendacaoLinha(
  posicao: PosicaoMesaJogadaDebug,
  linha: 'fria' | 'quente',
  decisao: { carta: Carta; motivo: string; etapa?: string },
): RecomendacaoLinha {
  return {
    carta: decisao.carta,
    motivo: decisao.motivo,
    caminho: criarCaminhoJogadaDebug(posicao, linha, decisao.etapa),
  };
}

function montarRecomendacaoQuente(
  posicao: PosicaoMesaJogadaDebug,
  resultado: ResultadoQuente,
  fria: RecomendacaoLinha,
): RecomendacaoLinha {
  if (resultado.tipo === 'segue-fria') {
    return montarRecomendacaoLinha(posicao, 'quente', {
      carta: fria.carta,
      motivo: resultado.motivo,
      etapa: resultado.etapa,
    });
  }

  return montarRecomendacaoLinha(posicao, 'quente', resultado);
}
