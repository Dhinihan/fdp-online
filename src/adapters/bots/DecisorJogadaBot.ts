import { avaliarCartas, type CartaAvaliada } from '@/core/avaliador-carta';
import type { Carta } from '@/core/Carta';
import { calcularIndiceVencedor, cartasEmpatam, cartaVence } from '@/core/comparador-carta';
import type { DecisorJogada } from '@/core/portas/DecisorJogada';
import type { GeradorAleatorio } from '@/core/RngComSeed';
import { estadoEmJogo, type EstadoEmJogo, type EstadoRodada, type MesaItem } from '@/types/estado-rodada';
import { decidirAbertura } from './decidirAbertura';
import { DecisorJogadaLinhaFria } from './DecisorJogadaLinhaFria';

interface ConfigDecisorJogadaBot {
  temperatura: number;
  rng: Pick<GeradorAleatorio, 'random'>;
  liderBaixa?: number;
  liderAlta?: number;
  urgenciaAbrirForte?: number;
}

export class DecisorJogadaBot implements DecisorJogada {
  private readonly fria = new DecisorJogadaLinhaFria();
  private readonly temperatura: number;
  private readonly rng: Pick<GeradorAleatorio, 'random'>;
  private readonly liderBaixa: number;
  private readonly liderAlta: number;
  private readonly urgenciaAbrirForte: number;

  constructor(config: ConfigDecisorJogadaBot) {
    this.temperatura = config.temperatura;
    this.rng = config.rng;
    this.liderBaixa = config.liderBaixa ?? 8;
    this.liderAlta = config.liderAlta ?? 11;
    this.urgenciaAbrirForte = config.urgenciaAbrirForte ?? 0.5;
  }

  async decidirJogada(mao: Carta[], estado: EstadoRodada): Promise<Carta> {
    if (mao.length === 0) return Promise.reject(new Error('Mão vazia'));

    const estadoAtual = estadoEmJogo(estado);
    if (estadoAtual.mesa.length === 0) {
      return decidirAbertura(mao, estadoAtual, {
        temperatura: this.temperatura,
        urgenciaAbrirForte: this.urgenciaAbrirForte,
      });
    }

    const contexto = criarContexto(estadoAtual, mao);
    const empate = escolherEmpate(estadoAtual, contexto, this.liderAlta);
    if (empate) return empate.carta;

    const travessia = escolherTravessia(estadoAtual, contexto);
    if (travessia) return travessia.carta;

    if (!podeBifurcar(estadoAtual, contexto, this.liderBaixa)) return this.fria.decidirJogada(mao, estado);
    if (this.rng.random() >= this.temperatura) return this.fria.decidirJogada(mao, estado);
    return escolherPressao(contexto).carta;
  }
}

interface ContextoJogada {
  jogadorId: string;
  necessidade: number;
  folga: number;
  avaliadas: CartaAvaliada[];
  vencedoras: CartaAvaliada[];
  perdedoras: CartaAvaliada[];
  lider: CartaAvaliada | null;
}

function criarContexto(estado: EstadoEmJogo, mao: Carta[]): ContextoJogada {
  const jogadorId = estado.maos[estado.jogadorAtual].jogador.id;
  const necessidade = calcularNecessidade(estado, jogadorId);
  const avaliadas = avaliarCartas(mao, estado.manilha, estado.cartasReveladas, estado.maos.length);
  const lider = avaliarLider(estado);
  return {
    jogadorId,
    necessidade,
    folga: mao.length - necessidade,
    avaliadas,
    vencedoras: lider ? avaliadas.filter((a) => cartaVence(a.carta, lider.carta, estado.manilha)) : [...avaliadas],
    perdedoras: lider ? avaliadas.filter((a) => !cartaVence(a.carta, lider.carta, estado.manilha)) : [],
    lider,
  };
}

function podeBifurcar(estado: EstadoEmJogo, contexto: ContextoJogada, liderBaixa: number): boolean {
  return (
    contexto.necessidade > 0 &&
    contexto.vencedoras.length > 0 &&
    mesaPodePunir(estado, contexto, liderBaixa) &&
    temSegurancaParaDepois(contexto) &&
    temPressaoAgora(contexto) &&
    temAlvo(estado, contexto.jogadorId)
  );
}

function mesaPodePunir(estado: EstadoEmJogo, contexto: ContextoJogada, liderBaixa: number): boolean {
  return Boolean(
    contexto.lider &&
    contexto.lider.score <= liderBaixa &&
    estado.mesa.some((item) => jogadorNaoQuerVaza(estado, item)),
  );
}

function temSegurancaParaDepois(contexto: ContextoJogada): boolean {
  return contexto.necessidade <= 1 && contexto.folga >= 1 && contexto.avaliadas.some(ehSeguraOuGarantida);
}

function temPressaoAgora(contexto: ContextoJogada): boolean {
  return cartasDeFuga(contexto).length > 0 || vencedorasBaratasSemGarantida(contexto).length > 0;
}

function escolherPressao(contexto: ContextoJogada): CartaAvaliada {
  const fuga = cartasDeFuga(contexto);
  if (fuga.length > 0) return cartaMaisCara(fuga);
  return cartaMaisBarata(vencedorasBaratasSemGarantida(contexto));
}

function escolherTravessia(estado: EstadoEmJogo, contexto: ContextoJogada): CartaAvaliada | null {
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

function escolherEmpate(estado: EstadoEmJogo, contexto: ContextoJogada, liderAlta: number): CartaAvaliada | null {
  const lider = contexto.lider;
  if (!lider || lider.score <= liderAlta) return null;
  const empates = contexto.avaliadas.filter((avaliada) => cartasEmpatam(avaliada.carta, lider.carta, estado.manilha));
  if (empates.length === 0) return null;
  if (contexto.necessidade <= 0 || contexto.folga >= 2) return cartaMaisCara(empates);
  return null;
}

function cartasDeFuga(contexto: ContextoJogada): CartaAvaliada[] {
  return contexto.perdedoras.filter((avaliada) => !ehSeguraOuGarantida(avaliada));
}

function vencedorasBaratasSemGarantida(contexto: ContextoJogada): CartaAvaliada[] {
  const candidatas = contexto.vencedoras.filter((avaliada) => !ehGarantida(avaliada));
  return candidatas.filter((carta) =>
    contexto.avaliadas.some((avaliada) => avaliada !== carta && ehGarantida(avaliada)),
  );
}

function avaliarLider(estado: EstadoEmJogo): CartaAvaliada | null {
  const carta = melhorCartaMesa(estado.mesa, estado.manilha);
  if (!carta) return null;
  return avaliarCartas([carta], estado.manilha, estado.cartasReveladas, estado.maos.length)[0];
}

function melhorCartaMesa(mesa: MesaItem[], manilha: Carta['valor']): Carta | null {
  if (mesa.length === 0) return null;
  return mesa[calcularIndiceVencedor(mesa, manilha)].carta;
}

function liderQuerVaza(estado: EstadoEmJogo): boolean {
  if (estado.mesa.length === 0) return false;
  const lider = estado.mesa[calcularIndiceVencedor(estado.mesa, estado.manilha)];
  return calcularNecessidade(estado, lider.jogadorId) > 0;
}

function temAlvo(estado: EstadoEmJogo, jogadorId: string): boolean {
  return Object.keys(estado.declaracoes).some((id) => id !== jogadorId && calcularNecessidade(estado, id) > 0);
}

function jogadorNaoQuerVaza(estado: EstadoEmJogo, item: MesaItem): boolean {
  return calcularNecessidade(estado, item.jogadorId) <= 0;
}

function calcularNecessidade(estado: EstadoEmJogo, jogadorId: string): number {
  return (estado.declaracoes[jogadorId] ?? 0) - (estado.vazas[jogadorId] ?? 0);
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
