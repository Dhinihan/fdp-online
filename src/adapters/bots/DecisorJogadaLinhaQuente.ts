import type { Carta } from '@/core/Carta';
import type { DecisorJogada } from '@/core/portas/DecisorJogada';
import type { GeradorAleatorio } from '@/core/RngComSeed';
import { estadoEmJogo, type EstadoEmJogo, type EstadoRodada } from '@/types/estado-rodada';
import { criarContextoLinhaQuente, ehUltimoDaMesa, type ContextoJogadaQuente } from './contextoLinhaQuente';
import { decidirUltimoLinhaQuente } from './decidirUltimoLinhaQuente';
import { DecisorJogadaLinhaFria } from './DecisorJogadaLinhaFria';
import type { LoggerDebugBot } from './logger-debug-bot';
import { registrarBifurcacao, registrarEscolhaDireta } from './registrar-decisao-jogada-bot';
import {
  cartasIguais,
  escolherEmpate,
  escolherPressao,
  escolherTravessia,
  MOTIVO_SEM_BIFURCACAO_CARTAS_IGUAIS,
  MOTIVO_SEM_BIFURCACAO_LINHAS_IGUAIS,
  MOTIVO_SEM_BIFURCACAO_NAO_PODE,
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
  private readonly fria = new DecisorJogadaLinhaFria();
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
    const fria = await this.fria.decidirJogada(mao, estado);
    const base = { mao, estado, estadoAtual, contexto, fria };

    if (ehUltimoDaMesa(estadoAtual)) return this.decidirUltimaJogada(base);
    return this.decidirAntesDoFim(base);
  }

  private decidirUltimaJogada(base: BaseJogada): Carta {
    const quente = decidirUltimoLinhaQuente(base.estadoAtual, base.contexto);
    return this.resolverBifurcacao(base, quente, MOTIVO_SEM_BIFURCACAO_LINHAS_IGUAIS);
  }

  private decidirAntesDoFim(base: BaseJogada): Carta {
    const direta = this.escolherQuenteDireta(base);
    if (direta) return direta;

    if (!podeBifurcar(base.estadoAtual, base.contexto, this.liderBaixa)) {
      return this.registrarSemBifurcacao(base, base.fria, MOTIVO_SEM_BIFURCACAO_NAO_PODE);
    }

    const quente = escolherPressao(base.contexto).carta;
    return this.resolverBifurcacao(base, quente, MOTIVO_SEM_BIFURCACAO_CARTAS_IGUAIS);
  }

  private resolverBifurcacao(base: BaseJogada, quente: Carta, motivoSemBifurcacao: string): Carta {
    if (cartasIguais(base.fria, quente)) {
      return this.registrarSemBifurcacao(base, quente, motivoSemBifurcacao);
    }

    const sorteio = this.rng.random();
    return registrarBifurcacao({
      logger: this.logger,
      temperatura: this.temperatura,
      mao: base.mao,
      estado: base.estado,
      fria: base.fria,
      quente,
      sorteio,
    });
  }

  private escolherQuenteDireta(base: BaseJogada): Carta | null {
    const empate = escolherEmpate(base.contexto, this.liderAlta);
    if (empate)
      return this.registrarQuente(
        base,
        empate.carta,
        'linha quente empatou: líder precisa fazer e carta do líder é alta+',
      );

    const travessia = escolherTravessia(base.estadoAtual, base.contexto);
    if (!travessia) return null;
    return this.registrarQuente(
      base,
      travessia.carta,
      'linha quente atravessou: líder precisa fazer e carta do líder é alta+',
    );
  }

  private registrarQuente(base: BaseJogada, carta: Carta, motivoLinhaQuente: string): Carta {
    return registrarEscolhaDireta({
      logger: this.logger,
      mao: base.mao,
      estado: base.estado,
      carta,
      linhaFria: base.fria,
      linhaQuente: carta,
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
      motivoSemBifurcacao: motivo,
      escolheuQuente: false,
    });
  }
}

interface BaseJogada {
  mao: Carta[];
  estado: EstadoRodada;
  estadoAtual: EstadoEmJogo;
  contexto: ContextoJogadaQuente;
  fria: Carta;
}
