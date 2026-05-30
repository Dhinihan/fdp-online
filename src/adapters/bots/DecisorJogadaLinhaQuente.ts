import type { Carta } from '@/core/Carta';
import type { DecisorJogada } from '@/core/portas/DecisorJogada';
import type { GeradorAleatorio } from '@/core/RngComSeed';
import { estadoEmJogo, type EstadoEmJogo, type EstadoRodada } from '@/types/estado-rodada';
import { ehUltimoDaMesa } from './contexto-posicao-mesa';
import { criarCaminhoJogadaDebug, type PosicaoMesaJogadaDebug } from './debug-jogada-bot';
import { criarDecisaoQuente, definirPosicao, type DecisaoQuente } from './debug-linha-quente';
import { decidirUltimoLinhaQuente } from './decidirUltimoLinhaQuente';
import { decidirNaoUltimoLinhaFria, decidirUltimoLinhaFria } from './DecisorJogadaLinhaFria';
import { lerMesa, type LeituraDaMesa } from './ler-mesa';
import type { LoggerDebugBot } from './logger-debug-bot';
import { escolherTravessia } from './pode-atravessar';
import { escolherEsperarOportunidade } from './pode-esperar-oportunidade';
import { escolherVencedoraSegura } from './pode-vencedora-segura';
import { escolherJaCumpriuNoMeio, escolherPressao, podeBifurcar } from './regras-linha-quente';
import { resolverPorTemperatura } from './resolucao-por-temperatura';

interface ConfigLinhaQuente {
  temperatura: number;
  rng: Pick<GeradorAleatorio, 'random'>;
  liderBaixa?: number;
  logger?: LoggerDebugBot;
}

export class DecisorJogadaLinhaQuente implements DecisorJogada {
  private readonly temperatura: number;
  private readonly rng: Pick<GeradorAleatorio, 'random'>;
  private readonly liderBaixa: number;
  private readonly logger?: LoggerDebugBot;

  constructor(config: ConfigLinhaQuente) {
    this.temperatura = config.temperatura;
    this.rng = config.rng;
    this.liderBaixa = config.liderBaixa ?? 8;
    this.logger = config.logger;
  }

  async decidirJogada(mao: Carta[], estado: EstadoRodada): Promise<Carta> {
    if (mao.length === 0) return Promise.reject(new Error('Mão vazia'));

    const estadoAtual = estadoEmJogo(estado);
    const leitura = lerMesa(estadoAtual, mao);

    if (ehUltimoDaMesa(estadoAtual)) {
      const decisaoFria = decidirUltimoLinhaFria(leitura, estadoAtual);
      const base = criarBaseJogada({ mao, estado, estadoAtual, leitura, decisaoFria });
      return this.decidirUltimaJogada(base);
    }

    const decisaoFria = decidirNaoUltimoLinhaFria(leitura, estadoAtual);
    const base = criarBaseJogada({ mao, estado, estadoAtual, leitura, decisaoFria });
    return this.decidirAntesDoFim(base);
  }

  private decidirUltimaJogada(base: BaseJogada): Carta {
    const quente = criarDecisaoQuente(
      decidirUltimoLinhaQuente(base.estadoAtual, base.leitura),
      criarCaminhoJogadaDebug(base.posicao, 'quente'),
    );
    return this.resolverBifurcacao(base, quente);
  }

  private decidirAntesDoFim(base: BaseJogada): Carta {
    const direta = this.escolherQuenteDireta(base);
    if (direta) return direta;

    const bifurcacao = podeBifurcar(base.leitura, this.liderBaixa);
    if (bifurcacao.pode) {
      return this.resolverQuenteRecomendada(base, {
        ...escolherPressao(base.leitura),
        etapa: 'pressiona',
      });
    }

    const vencedoraSegura = escolherVencedoraSegura(base.leitura);
    if (vencedoraSegura) {
      return this.resolverQuenteRecomendada(base, { ...vencedoraSegura, etapa: 'vencedora segura' });
    }

    const espera = escolherEsperarOportunidade(base.estadoAtual, base.leitura);
    if (espera) {
      return this.resolverQuenteRecomendada(base, { ...espera, etapa: 'espera oportunidade' });
    }

    return this.registrarSeguirFria(base, 'linha quente segue fria: nenhum ramo se aplica');
  }

  private resolverBifurcacao(base: BaseJogada, quente: DecisaoQuente): Carta {
    return resolverPorTemperatura({
      logger: this.logger,
      temperatura: this.temperatura,
      rng: this.rng,
      mao: base.mao,
      estado: base.estado,
      fria: { carta: base.fria, motivo: base.motivoLinhaFria, caminho: base.caminhoLinhaFria },
      quente: { carta: quente.carta, motivo: quente.motivo, caminho: quente.caminho },
    });
  }

  private escolherQuenteDireta(base: BaseJogada): Carta | null {
    if (base.leitura.necessidade <= 0) {
      const jaCumpriu = escolherJaCumpriuNoMeio(base.estadoAtual, base.leitura);
      if (jaCumpriu) return this.resolverQuenteRecomendada(base, jaCumpriu);
      return this.registrarSeguirFria(base, 'linha quente segue fria: sem carta que não faz');
    }

    const travessia = escolherTravessia(base.leitura);
    if (!travessia) return null;
    return this.resolverQuenteRecomendada(base, { ...travessia, etapa: 'atravessa' });
  }

  private resolverQuenteRecomendada(base: BaseJogada, recomendacao: RecomendacaoQuenteResolve): Carta {
    const quente = criarDecisaoQuente(
      { carta: recomendacao.carta, motivo: recomendacao.motivo },
      criarCaminhoJogadaDebug(base.posicao, 'quente', recomendacao.etapa),
    );
    return this.resolverBifurcacao(base, quente);
  }

  private registrarSeguirFria(base: BaseJogada, motivo: string): Carta {
    const quente = criarDecisaoQuente(
      { carta: base.fria, motivo },
      criarCaminhoJogadaDebug(base.posicao, 'quente', 'segue fria'),
    );
    return this.resolverBifurcacao(base, quente);
  }
}

interface BaseJogada {
  mao: Carta[];
  estado: EstadoRodada;
  estadoAtual: EstadoEmJogo;
  leitura: LeituraDaMesa;
  posicao: PosicaoMesaJogadaDebug;
  fria: Carta;
  motivoLinhaFria: string;
  caminhoLinhaFria: string[];
}

interface RecomendacaoQuenteResolve {
  carta: Carta;
  motivo: string;
  etapa?: string;
}

interface ConfigBaseJogada {
  mao: Carta[];
  estado: EstadoRodada;
  estadoAtual: EstadoEmJogo;
  leitura: LeituraDaMesa;
  decisaoFria: { carta: Carta; motivo: string; caminho?: string[] };
}

function criarBaseJogada(config: ConfigBaseJogada): BaseJogada {
  const posicao = definirPosicao(config.estadoAtual);
  return {
    mao: config.mao,
    estado: config.estado,
    estadoAtual: config.estadoAtual,
    leitura: config.leitura,
    posicao,
    fria: config.decisaoFria.carta,
    motivoLinhaFria: config.decisaoFria.motivo,
    caminhoLinhaFria: config.decisaoFria.caminho ?? criarCaminhoJogadaDebug(posicao, 'fria'),
  };
}
