import type { Carta } from '@/core/Carta';
import type { DecisorJogada } from '@/core/portas/DecisorJogada';
import type { GeradorAleatorio } from '@/core/RngComSeed';
import { estadoEmJogo, type EstadoEmJogo, type EstadoRodada } from '@/types/estado-rodada';
import { criarContextoLinhaQuente, ehUltimoDaMesa, type ContextoJogadaQuente } from './contextoLinhaQuente';
import { decidirUltimoLinhaQuente } from './decidirUltimoLinhaQuente';
import { decidirNaoUltimoLinhaFria, decidirUltimoLinhaFria } from './DecisorJogadaLinhaFria';
import type { LoggerDebugBot } from './logger-debug-bot';
import { registrarBifurcacao, registrarEscolhaDireta } from './registrar-decisao-jogada-bot';
import {
  cartasIguais,
  escolherEmpate,
  escolherPressao,
  escolherTravessia,
  formatarMotivoRecusaBifurcacao,
  type DecisaoCartaQuente,
  MOTIVO_SEM_BIFURCACAO_CARTAS_IGUAIS,
  MOTIVO_SEM_BIFURCACAO_LINHAS_IGUAIS,
  podeBifurcar,
} from './regras-linha-quente';

interface ConfigLinhaQuente {
  temperatura: number;
  rng: Pick<GeradorAleatorio, 'random'>;
  liderBaixa?: number;
  liderAlta?: number;
  logger?: LoggerDebugBot;
}

export class DecisorJogadaLinhaQuente implements DecisorJogada {
  private readonly temperatura: number;
  private readonly rng: Pick<GeradorAleatorio, 'random'>;
  private readonly liderBaixa: number;
  private readonly liderAlta: number;
  private readonly logger?: LoggerDebugBot;

  constructor(config: ConfigLinhaQuente) {
    this.temperatura = config.temperatura;
    this.rng = config.rng;
    this.liderBaixa = config.liderBaixa ?? 8;
    this.liderAlta = config.liderAlta ?? 11;
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
    const quente = decidirUltimoLinhaQuente(base.estadoAtual, base.contexto);
    return this.resolverBifurcacaoUltimo({
      base,
      quente,
      motivoSemBifurcacao: MOTIVO_SEM_BIFURCACAO_LINHAS_IGUAIS,
    });
  }

  private decidirAntesDoFim(base: BaseJogada): Carta {
    const direta = this.escolherQuenteDireta(base);
    if (direta) return direta;

    const bifurcacao = podeBifurcar(base.estadoAtual, base.contexto, this.liderBaixa);
    if (!bifurcacao.pode) {
      const motivo = bifurcacao.motivoRecusa
        ? formatarMotivoRecusaBifurcacao(bifurcacao.motivoRecusa)
        : MOTIVO_SEM_BIFURCACAO_LINHAS_IGUAIS;
      return this.registrarSemBifurcacao(base, base.fria, motivo);
    }

    const quente = escolherPressao(base.contexto);
    return this.resolverBifurcacao(base, quente, MOTIVO_SEM_BIFURCACAO_CARTAS_IGUAIS);
  }

  private resolverBifurcacao(base: BaseJogada, quente: DecisaoCartaQuente, motivoSemBifurcacao: string): Carta {
    const cartaQuente = quente.carta.carta;
    if (cartasIguais(base.fria, cartaQuente)) {
      return this.registrarSemBifurcacao(base, cartaQuente, motivoSemBifurcacao);
    }

    const sorteio = this.rng.random();
    return registrarBifurcacao({
      logger: this.logger,
      temperatura: this.temperatura,
      mao: base.mao,
      estado: base.estado,
      fria: base.fria,
      quente: cartaQuente,
      motivoLinhaFria: base.motivoLinhaFria,
      motivoLinhaQuente: quente.motivo,
      sorteio,
    });
  }

  private resolverBifurcacaoUltimo(config: ResolucaoUltimo): Carta {
    if (cartasIguais(config.base.fria, config.quente.carta)) {
      return this.registrarSemBifurcacaoUltimo(config);
    }

    const sorteio = this.rng.random();
    return registrarBifurcacao({
      logger: this.logger,
      temperatura: this.temperatura,
      mao: config.base.mao,
      estado: config.base.estado,
      fria: config.base.fria,
      quente: config.quente.carta,
      motivoLinhaFria: config.base.motivoLinhaFria,
      motivoLinhaQuente: config.quente.motivo,
      sorteio,
    });
  }

  private escolherQuenteDireta(base: BaseJogada): Carta | null {
    const empate = escolherEmpate(base.contexto, this.liderAlta);
    if (empate) return this.registrarQuente(base, empate.carta.carta, `linha quente empatou: ${empate.motivo}`);

    const travessia = escolherTravessia(base.estadoAtual, base.contexto);
    if (!travessia) return null;
    return this.registrarQuente(base, travessia.carta.carta, `linha quente atravessou: ${travessia.motivo}`);
  }

  private registrarQuente(base: BaseJogada, carta: Carta, motivoLinhaQuente: string): Carta {
    return registrarEscolhaDireta({
      logger: this.logger,
      mao: base.mao,
      estado: base.estado,
      carta,
      linhaFria: base.fria,
      linhaQuente: carta,
      motivoLinhaFria: base.motivoLinhaFria,
      motivoLinhaQuente,
      escolheuQuente: true,
    });
  }

  private registrarSemBifurcacao(base: BaseJogada, linhaQuente: Carta, motivo: string): Carta {
    return registrarEscolhaDireta({
      logger: this.logger,
      mao: base.mao,
      estado: base.estado,
      carta: linhaQuente,
      linhaFria: base.fria,
      linhaQuente,
      motivoLinhaFria: base.motivoLinhaFria,
      motivoSemBifurcacao: motivo,
      escolheuQuente: false,
    });
  }

  private registrarSemBifurcacaoUltimo(config: ResolucaoUltimo): Carta {
    return registrarEscolhaDireta({
      logger: this.logger,
      mao: config.base.mao,
      estado: config.base.estado,
      carta: config.quente.carta,
      linhaFria: config.base.fria,
      linhaQuente: config.quente.carta,
      motivoLinhaFria: config.base.motivoLinhaFria,
      motivoLinhaQuente: config.quente.motivo,
      motivoSemBifurcacao: config.motivoSemBifurcacao,
      escolheuQuente: false,
    });
  }
}

interface ResolucaoUltimo {
  base: BaseJogada;
  quente: { carta: Carta; motivo: string };
  motivoSemBifurcacao: string;
}

interface BaseJogada {
  mao: Carta[];
  estado: EstadoRodada;
  estadoAtual: EstadoEmJogo;
  contexto: ContextoJogadaQuente;
  fria: Carta;
  motivoLinhaFria: string;
}

interface ConfigBaseJogada {
  mao: Carta[];
  estado: EstadoRodada;
  estadoAtual: EstadoEmJogo;
  contexto: ContextoJogadaQuente;
  decisaoFria: { carta: Carta; motivo: string };
}

function criarBaseJogada(config: ConfigBaseJogada): BaseJogada {
  return {
    mao: config.mao,
    estado: config.estado,
    estadoAtual: config.estadoAtual,
    contexto: config.contexto,
    fria: config.decisaoFria.carta,
    motivoLinhaFria: config.decisaoFria.motivo,
  };
}
