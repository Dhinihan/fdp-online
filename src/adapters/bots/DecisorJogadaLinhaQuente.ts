import type { CartaAvaliada } from '@/core/avaliador-carta';
import type { Carta } from '@/core/Carta';
import { cartasEmpatam } from '@/core/comparador-carta';
import type { DecisorJogada } from '@/core/portas/DecisorJogada';
import type { GeradorAleatorio } from '@/core/RngComSeed';
import { estadoEmJogo, type EstadoEmJogo, type EstadoRodada, type MesaItem } from '@/types/estado-rodada';
import {
  calcularNecessidade,
  criarContextoLinhaQuente,
  ehUltimoDaMesa,
  liderQuerVaza,
  type ContextoJogadaQuente,
} from './contextoLinhaQuente';
import { decidirUltimoLinhaQuente } from './decidirUltimoLinhaQuente';
import { DecisorJogadaLinhaFria } from './DecisorJogadaLinhaFria';
import type { LoggerDebugBot } from './logger-debug-bot';
import { registrarBifurcacao, registrarEscolhaDireta } from './registrar-decisao-jogada-bot';

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
    const deterministica = this.decidirJogadaDeterministica({ mao, estado, estadoAtual, contexto });
    if (deterministica) return deterministica;

    const empate = escolherEmpate(estadoAtual, contexto, this.liderAlta);
    if (empate) {
      return registrarEscolhaDireta({ logger: this.logger, mao, estado, carta: empate.carta, escolheuQuente: true });
    }

    const travessia = escolherTravessia(estadoAtual, contexto);
    if (travessia) {
      return registrarEscolhaDireta({ logger: this.logger, mao, estado, carta: travessia.carta, escolheuQuente: true });
    }

    const fria = await this.fria.decidirJogada(mao, estado);
    if (!podeBifurcar(estadoAtual, contexto, this.liderBaixa)) {
      return registrarEscolhaDireta({ logger: this.logger, mao, estado, carta: fria, escolheuQuente: false });
    }

    const quente = escolherPressao(contexto).carta;
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

  private decidirJogadaDeterministica(config: ConfigJogadaDeterministica): Carta | null {
    if (!ehUltimoDaMesa(config.estadoAtual)) return null;
    const carta = decidirUltimoLinhaQuente(config.estadoAtual, config.contexto);
    return registrarEscolhaDireta({
      logger: this.logger,
      mao: config.mao,
      estado: config.estado,
      carta,
      escolheuQuente: false,
    });
  }
}

interface ConfigJogadaDeterministica {
  mao: Carta[];
  estado: EstadoRodada;
  estadoAtual: EstadoEmJogo;
  contexto: ContextoJogadaQuente;
}

function podeBifurcar(estado: EstadoEmJogo, contexto: ContextoJogadaQuente, liderBaixa: number): boolean {
  return (
    contexto.necessidade > 0 &&
    contexto.vencedoras.length > 0 &&
    mesaPodePunir(estado, contexto, liderBaixa) &&
    temSegurancaParaDepois(contexto) &&
    temPressaoAgora(contexto) &&
    temAlvo(estado, contexto.jogadorId)
  );
}

function mesaPodePunir(estado: EstadoEmJogo, contexto: ContextoJogadaQuente, liderBaixa: number): boolean {
  return Boolean(
    contexto.lider &&
    contexto.lider.score <= liderBaixa &&
    estado.mesa.some((item) => jogadorNaoQuerVaza(estado, item)),
  );
}

function temSegurancaParaDepois(contexto: ContextoJogadaQuente): boolean {
  return contexto.necessidade <= 1 && contexto.folga >= 1 && contexto.avaliadas.some(ehSeguraOuGarantida);
}

function temPressaoAgora(contexto: ContextoJogadaQuente): boolean {
  return cartasDeFuga(contexto).length > 0 || vencedorasBaratasSemGarantida(contexto).length > 0;
}

function escolherPressao(contexto: ContextoJogadaQuente): CartaAvaliada {
  const fuga = cartasDeFuga(contexto);
  if (fuga.length > 0) return cartaMaisCara(fuga);
  return cartaMaisBarata(vencedorasBaratasSemGarantida(contexto));
}

function escolherTravessia(estado: EstadoEmJogo, contexto: ContextoJogadaQuente): CartaAvaliada | null {
  if (
    contexto.necessidade <= 0 ||
    contexto.folga > 1 ||
    !liderQuerVaza(estado) ||
    !temAlvo(estado, contexto.jogadorId)
  ) {
    return null;
  }
  const candidatas = contexto.vencedoras.filter((avaliada) => !ehGarantida(avaliada));
  return candidatas.length > 0 ? cartaMaisBarata(candidatas) : null;
}

function escolherEmpate(estado: EstadoEmJogo, contexto: ContextoJogadaQuente, liderAlta: number): CartaAvaliada | null {
  const lider = contexto.lider;
  if (!lider || lider.score <= liderAlta) return null;
  const empates = contexto.avaliadas.filter((avaliada) => cartasEmpatam(avaliada.carta, lider.carta, estado.manilha));
  if (empates.length === 0) return null;
  if (contexto.necessidade <= 0 || contexto.folga >= 2) return cartaMaisCara(empates);
  return null;
}

function cartasDeFuga(contexto: ContextoJogadaQuente): CartaAvaliada[] {
  return [...contexto.perdedoras, ...contexto.empates].filter((avaliada) => !ehSeguraOuGarantida(avaliada));
}

function vencedorasBaratasSemGarantida(contexto: ContextoJogadaQuente): CartaAvaliada[] {
  const candidatas = contexto.vencedoras.filter((avaliada) => !ehGarantida(avaliada));
  return candidatas.filter((carta) =>
    contexto.avaliadas.some((avaliada) => avaliada !== carta && ehGarantida(avaliada)),
  );
}

function temAlvo(estado: EstadoEmJogo, jogadorId: string): boolean {
  return Object.keys(estado.declaracoes).some((id) => id !== jogadorId && calcularNecessidade(estado, id) > 0);
}

function jogadorNaoQuerVaza(estado: EstadoEmJogo, item: MesaItem): boolean {
  return calcularNecessidade(estado, item.jogadorId) <= 0;
}

function ehSeguraOuGarantida(avaliada: CartaAvaliada): boolean {
  return avaliada.categoria === 'segura' || avaliada.categoria === 'garantida_agora';
}

function ehGarantida(avaliada: CartaAvaliada): boolean {
  return avaliada.categoria === 'garantida_agora';
}

function cartaMaisBarata(avaliadas: CartaAvaliada[]): CartaAvaliada {
  return [...avaliadas].sort((a, b) => a.score - b.score)[0];
}

function cartaMaisCara(avaliadas: CartaAvaliada[]): CartaAvaliada {
  return [...avaliadas].sort((a, b) => b.score - a.score)[0];
}
