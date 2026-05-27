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
    const quente = criarDecisaoQuente(decidirUltimoLinhaQuente(base.estadoAtual, base.contexto), [
      'jogada',
      'fecha a mesa',
      'linha quente',
    ]);
    return this.resolverBifurcacao(base, quente, MOTIVO_SEM_BIFURCACAO_LINHAS_IGUAIS);
  }

  private decidirAntesDoFim(base: BaseJogada): Carta {
    const direta = this.escolherQuenteDireta(base);
    if (direta) return direta;

    const bifurcacao = podeBifurcar(base.estadoAtual, base.contexto, this.liderBaixa);
    if (!bifurcacao.pode) {
      const motivo = bifurcacao.motivoRecusa
        ? formatarMotivoRecusaBifurcacao(bifurcacao.motivoRecusa)
        : MOTIVO_SEM_BIFURCACAO_LINHAS_IGUAIS;
      return this.registrarSemBifurcacao(
        base,
        criarDecisaoQuente({ carta: base.fria, motivo }, base.caminhoLinhaFria),
        motivo,
      );
    }

    const quente = criarDecisaoQuente(escolherPressao(base.contexto), ['jogada', 'joga no meio', 'linha quente']);
    return this.resolverBifurcacao(base, quente, MOTIVO_SEM_BIFURCACAO_CARTAS_IGUAIS);
  }

  private resolverBifurcacao(base: BaseJogada, quente: DecisaoQuente, motivoSemBifurcacao: string): Carta {
    if (cartasIguais(base.fria, quente.carta)) {
      return this.registrarSemBifurcacao(base, quente, motivoSemBifurcacao);
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
    const empate = escolherEmpate(base.contexto, this.liderAlta);
    if (empate) return this.registrarQuente(base, empate.carta, `linha quente empatou: ${empate.motivo}`);

    const travessia = escolherTravessia(base.estadoAtual, base.contexto);
    if (!travessia) return null;
    return this.registrarQuente(base, travessia.carta, `linha quente atravessou: ${travessia.motivo}`);
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
      caminhoLinhaFria: base.caminhoLinhaFria,
      caminhoLinhaQuente: ['jogada', 'linha quente', 'escolha direta'],
      escolheuQuente: true,
    });
  }

  private registrarSemBifurcacao(base: BaseJogada, quente: DecisaoQuente, motivo: string): Carta {
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
      motivoSemBifurcacao: motivo,
      escolheuQuente: false,
    });
  }
}

interface DecisaoQuente {
  carta: Carta;
  motivo: string;
  caminho: string[];
}

interface BaseJogada {
  mao: Carta[];
  estado: EstadoRodada;
  estadoAtual: EstadoEmJogo;
  contexto: ContextoJogadaQuente;
  fria: Carta;
  motivoLinhaFria: string;
  caminhoLinhaFria: string[];
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
    caminhoLinhaFria: ['jogada', caminhoPosicao(config.estadoAtual), 'linha fria'],
  };
}

function caminhoPosicao(estado: EstadoEmJogo): string {
  if (estado.mesa.length === 0) return 'abre a mesa';
  if (ehUltimoDaMesa(estado)) return 'fecha a mesa';
  return 'joga no meio';
}

function criarDecisaoQuente(decisao: { carta: Carta; motivo: string }, caminho: string[]): DecisaoQuente {
  return { ...decisao, caminho };
}
