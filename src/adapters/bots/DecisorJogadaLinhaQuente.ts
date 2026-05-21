import type { Carta } from '@/core/Carta';
import type { DecisorJogada } from '@/core/portas/DecisorJogada';
import type { GeradorAleatorio } from '@/core/RngComSeed';
import { estadoEmJogo, type EstadoEmJogo, type EstadoRodada } from '@/types/estado-rodada';
import { DecisorJogadaLinhaFria } from './DecisorJogadaLinhaFria';
import type { LoggerDebugBot } from './logger-debug-bot';
import { registrarBifurcacao, registrarEscolhaDireta } from './registrar-decisao-jogada-bot';
import {
  cartasIguais,
  criarContexto,
  escolherEmpate,
  escolherPressao,
  escolherTravessia,
  type ContextoJogada,
  motivoSemBifurcacao,
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
    const contexto = criarContexto(estadoAtual, mao);
    const fria = await this.fria.decidirJogada(mao, estado);
    const base = { mao, estado, estadoAtual, contexto, fria };
    const direta = this.escolherQuenteDireta(base);

    if (direta) return direta;

    if (!podeBifurcar(estadoAtual, contexto, this.liderBaixa)) {
      return this.registrarSemBifurcacao(base, fria);
    }

    const quente = escolherPressao(contexto).carta;
    if (cartasIguais(fria, quente)) return this.registrarSemBifurcacao(base, quente);

    const sorteio = this.rng.random();
    return registrarBifurcacao({
      logger: this.logger,
      temperatura: this.temperatura,
      mao,
      estado,
      fria,
      quente,
      sorteio,
    });
  }

  private escolherQuenteDireta(base: BaseJogada): Carta | null {
    const empate = escolherEmpate(base.estadoAtual, base.contexto, this.liderAlta);
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

  private registrarSemBifurcacao(base: BaseJogada, linhaQuente: Carta): Carta {
    return registrarEscolhaDireta({
      logger: this.logger,
      mao: base.mao,
      estado: base.estado,
      carta: base.fria,
      linhaFria: base.fria,
      linhaQuente,
      motivoSemBifurcacao: motivoSemBifurcacao(base.contexto),
      escolheuQuente: false,
    });
  }
}

interface BaseJogada {
  mao: Carta[];
  estado: EstadoRodada;
  estadoAtual: EstadoEmJogo;
  contexto: ContextoJogada;
  fria: Carta;
}
