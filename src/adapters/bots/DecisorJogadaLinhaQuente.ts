import type { Carta } from '@/core/Carta';
import type { DecisorJogada } from '@/core/portas/DecisorJogada';
import type { GeradorAleatorio } from '@/core/RngComSeed';
import { estadoEmJogo, type EstadoEmJogo, type EstadoRodada } from '@/types/estado-rodada';
import { criarContextoLinhaQuente, ehUltimoDaMesa, type ContextoJogadaQuente } from './contextoLinhaQuente';
import { criarCaminhoJogadaDebug, type PosicaoMesaJogadaDebug } from './debug-jogada-bot';
import { criarDecisaoQuente, definirPosicao, type DecisaoQuente } from './debug-linha-quente';
import { decidirUltimoLinhaQuente } from './decidirUltimoLinhaQuente';
import { decidirNaoUltimoLinhaFria, decidirUltimoLinhaFria } from './DecisorJogadaLinhaFria';
import type { LoggerDebugBot } from './logger-debug-bot';
import { escolherTravessia } from './pode-atravessar';
import { escolherEsperarOportunidade } from './pode-esperar-oportunidade';
import { escolherVencedoraSegura } from './pode-vencedora-segura';
import { registrarBifurcacao, registrarEscolhaDireta } from './registrar-decisao-jogada-bot';
import { cartasIguais, escolherJaCumpriuNoMeio, escolherPressao, podeBifurcar } from './regras-linha-quente';

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
    const contexto = criarContextoLinhaQuente(estadoAtual, mao);

    if (ehUltimoDaMesa(estadoAtual)) {
      const decisaoFria = decidirUltimoLinhaFria(mao, estadoAtual);
      const base = criarBaseJogada({ mao, estado, estadoAtual, contexto, decisaoFria });
      return this.decidirUltimaJogada(base);
    }

    const decisaoFria = decidirNaoUltimoLinhaFria(mao, estadoAtual);
    const base = criarBaseJogada({ mao, estado, estadoAtual, contexto, decisaoFria });
    return this.decidirAntesDoFim(base);
  }

  private decidirUltimaJogada(base: BaseJogada): Carta {
    const quente = criarDecisaoQuente(
      decidirUltimoLinhaQuente(base.estadoAtual, base.contexto),
      criarCaminhoJogadaDebug(base.posicao, 'quente'),
    );
    return this.resolverBifurcacao(base, quente);
  }

  private decidirAntesDoFim(base: BaseJogada): Carta {
    const direta = this.escolherQuenteDireta(base);
    if (direta) return direta;

    const bifurcacao = podeBifurcar(base.estadoAtual, base.contexto, this.liderBaixa);
    if (bifurcacao.pode) {
      return this.resolverQuenteRecomendada(base, {
        ...escolherPressao(base.contexto),
        etapa: 'pressiona',
      });
    }

    const vencedoraSegura = escolherVencedoraSegura(base.estadoAtual, base.contexto);
    if (vencedoraSegura) {
      return this.resolverQuenteRecomendada(base, { ...vencedoraSegura, etapa: 'vencedora segura' });
    }

    const espera = escolherEsperarOportunidade(base.estadoAtual, base.contexto);
    if (espera) {
      return this.resolverQuenteRecomendada(base, { ...espera, etapa: 'espera oportunidade' });
    }

    return this.registrarSeguirFria(base, 'linha quente segue fria: nenhum ramo se aplica');
  }

  private resolverBifurcacao(base: BaseJogada, quente: DecisaoQuente): Carta {
    if (cartasIguais(base.fria, quente.carta)) {
      return this.registrarSemBifurcacao(base, quente);
    }

    const sorteio = this.rng.random();
    return registrarBifurcacao({
      logger: this.logger,
      temperatura: this.temperatura,
      mao: base.mao,
      estado: base.estado,
      fria: base.fria,
      quente: quente.carta,
      motivoLinhaFria: base.motivoLinhaFria,
      motivoLinhaQuente: quente.motivo,
      caminhoLinhaFria: base.caminhoLinhaFria,
      caminhoLinhaQuente: quente.caminho,
      sorteio,
    });
  }

  private escolherQuenteDireta(base: BaseJogada): Carta | null {
    if (base.contexto.necessidade <= 0) {
      const jaCumpriu = escolherJaCumpriuNoMeio(base.estadoAtual, base.contexto);
      if (jaCumpriu) return this.resolverQuenteRecomendada(base, jaCumpriu);
      return this.registrarSeguirFria(base, 'linha quente segue fria: sem carta que não faz');
    }

    const travessia = escolherTravessia(base.estadoAtual, base.contexto);
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
    return this.registrarSemBifurcacao(
      base,
      criarDecisaoQuente({ carta: base.fria, motivo }, criarCaminhoJogadaDebug(base.posicao, 'quente', 'segue fria')),
    );
  }

  private registrarSemBifurcacao(base: BaseJogada, quente: DecisaoQuente): Carta {
    return registrarEscolhaDireta({
      logger: this.logger,
      mao: base.mao,
      estado: base.estado,
      carta: quente.carta,
      linhaFria: base.fria,
      linhaQuente: quente.carta,
      motivoLinhaFria: base.motivoLinhaFria,
      motivoLinhaQuente: quente.motivo,
      caminhoLinhaFria: base.caminhoLinhaFria,
      caminhoLinhaQuente: quente.caminho,
      escolheuQuente: false,
    });
  }
}

interface BaseJogada {
  mao: Carta[];
  estado: EstadoRodada;
  estadoAtual: EstadoEmJogo;
  contexto: ContextoJogadaQuente;
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
  contexto: ContextoJogadaQuente;
  decisaoFria: { carta: Carta; motivo: string; caminho?: string[] };
}

function criarBaseJogada(config: ConfigBaseJogada): BaseJogada {
  const posicao = definirPosicao(config.estadoAtual);
  return {
    mao: config.mao,
    estado: config.estado,
    estadoAtual: config.estadoAtual,
    contexto: config.contexto,
    posicao,
    fria: config.decisaoFria.carta,
    motivoLinhaFria: config.decisaoFria.motivo,
    caminhoLinhaFria: config.decisaoFria.caminho ?? criarCaminhoJogadaDebug(posicao, 'fria'),
  };
}
