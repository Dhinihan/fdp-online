import { avaliarCartas, type CartaAvaliada } from '@/core/avaliador-carta';
import type { Carta } from '@/core/Carta';
import { estadoEmJogo, type EstadoRodada, type MesaItem } from '@/types/estado-rodada';
import type { DecisaoDeclaracaoDebug, DefensivoDebug } from './debug-declaracao-bot';
import type { ContextoJogadaDebug, LinhaJogadaDebug } from './debug-jogada-bot';
/* eslint-disable no-console */

export interface LoggerDebugBot {
  registrarDeclaracao(decisao: DecisaoDeclaracaoDebug): void;
  registrarJogada(decisao: DecisaoJogadaDebug): void;
}

export interface DecisaoJogadaDebug {
  estado: EstadoRodada;
  mao: Carta[];
  linhaFria: Carta;
  linhaQuente: Carta;
  contexto?: ContextoJogadaDebug;
  fria?: LinhaJogadaDebug;
  quente?: LinhaJogadaDebug;
  motivoLinhaFria?: string;
  motivoLinhaQuente?: string;
  motivoSemBifurcacao?: string;
  carta: Carta;
  sorteio?: number;
  escolheuQuente: boolean;
}

export function criarLoggerDebugBot(nome: string, temperatura: number): LoggerDebugBot {
  return {
    registrarDeclaracao: (decisao) => {
      registrarDeclaracao(nome, temperatura, decisao);
    },
    registrarJogada: (decisao) => {
      registrarJogada(nome, temperatura, decisao);
    },
  };
}

function registrarDeclaracao(nome: string, temperatura: number, decisao: DecisaoDeclaracaoDebug): void {
  const prefixo = criarPrefixo(nome, temperatura);
  console.groupCollapsed(`${prefixo} — DECLARAÇÃO`);
  if (decisao.regraEspecialPrimeiraRodada) {
    console.log('Regra especial N=1: própria carta oculta não entrou no cálculo');
  }
  console.log(`Mão: [${formatarAvaliadas(decisao.mao)}]`);
  console.log(formatarContagens(decisao));
  console.log(`→ Declarou: ${decisao.resultadoFinal.toString()}`);
  console.groupEnd();
}

function registrarJogada(nome: string, temperatura: number, decisao: DecisaoJogadaDebug): void {
  const estado = estadoEmJogo(decisao.estado);
  const jogador = estado.maos[estado.jogadorAtual].jogador;
  const necessidade = (estado.declaracoes[jogador.id] ?? 0) - (estado.vazas[jogador.id] ?? 0);
  const folga = decisao.mao.length - necessidade;
  const avaliadas = avaliarCartas(decisao.mao, estado.manilha, estado.cartasReveladas, estado.maos.length);
  console.groupCollapsed(
    formatarTituloJogada({
      nome,
      temperatura,
      turno: estado.turno,
      cartasPorRodada: estado.cartasPorRodada,
      necessidade,
      folga,
    }),
  );
  console.log(`Mesa: [${formatarMesa(estado.mesa)}]`);
  console.log(`Classificação: [${formatarAvaliadas(avaliadas)}]`);
  console.log(formatarBifurcacao(decisao));
  console.log(formatarLinhas(decisao));
  console.log(formatarSorteio(decisao.sorteio, decisao.escolheuQuente, temperatura));
  console.log(`→ Jogou: ${formatarCarta(decisao.carta)}`);
  console.groupEnd();
}

function criarPrefixo(nome: string, temperatura: number): string {
  const emoji = temperatura < 0.3 ? '🔵' : temperatura > 0.7 ? '🔴' : '🟡';
  return `${emoji} ${nome} (T=${temperatura.toFixed(2)})`;
}

function formatarAvaliadas(avaliadas: CartaAvaliada[]): string {
  return avaliadas.map((avaliada) => `${formatarCarta(avaliada.carta)} ${avaliada.categoria}`).join(', ');
}

function formatarMesa(mesa: MesaItem[]): string {
  return mesa.map((item) => `${item.jogadorId}: ${formatarCarta(item.carta)}`).join(', ');
}

function formatarContagens(decisao: DecisaoDeclaracaoDebug): string {
  if (decisao.regraEspecialPrimeiraRodada) return formatarContagensPrimeiraRodada(decisao);
  return [
    `Base determinística: ${decisao.baseDeterministica.toString()}`,
    `Altas candidatas: [${formatarAvaliadas(decisao.altasCandidatas)}] (${decisao.altasCandidatas.length.toString()})`,
    `Sorteios aplicáveis: [${formatarAvaliadas(decisao.sorteiosAplicaveis)}] (${decisao.sorteiosAplicaveis.length.toString()})`,
    `Sorteios não aplicáveis: [${formatarAvaliadas(decisao.sorteiosNaoAplicaveis)}] (${decisao.sorteiosNaoAplicaveis.length.toString()})`,
    `+1 defensivo: ${formatarDefensivo(decisao.defensivo)}`,
    `Resultado final: ${decisao.resultadoFinal.toString()}`,
  ].join(' | ');
}

function formatarContagensPrimeiraRodada(decisao: DecisaoDeclaracaoDebug): string {
  return [
    `Fortes visíveis: [${formatarAvaliadas(decisao.fortesVisiveis)}] (${decisao.fortesVisiveis.length.toString()})`,
    `Resultado final: ${decisao.resultadoFinal.toString()}`,
  ].join(' | ');
}

function formatarDefensivo(defensivo: DefensivoDebug): string {
  if (defensivo.estado === 'não elegível') return defensivo.estado;
  if (defensivo.estado === 'sorteou') return `sorteou: ${simNao(defensivo.aplicaria)}`;
  if (defensivo.estado === 'aplicado') return defensivo.estado;
  return `bloqueado (base=${defensivo.base.toString()}, teto=floor(${defensivo.cartasPorRodada.toString()}/2)=${defensivo.teto.toString()}, aplicar +1 resultaria em ${defensivo.resultado.toString()})`;
}

function formatarBifurcacao(decisao: DecisaoJogadaDebug): string {
  if (decisao.sorteio !== undefined) {
    return `Bifurcação: ocorreu | fria ${formatarCarta(decisao.linhaFria)} | quente ${formatarCarta(
      decisao.linhaQuente,
    )}`;
  }
  const motivo = decisao.motivoSemBifurcacao ? ` | ${decisao.motivoSemBifurcacao}` : '';
  return `Bifurcação: não ocorreu${motivo}`;
}

function formatarTituloJogada(titulo: TituloJogada): string {
  return `${criarPrefixo(titulo.nome, titulo.temperatura)} — JOGADA (turno ${titulo.turno.toString()}/${titulo.cartasPorRodada.toString()}, necessário: ${titulo.necessidade.toString()}, folga: ${titulo.folga.toString()})`;
}

interface TituloJogada {
  nome: string;
  temperatura: number;
  turno: number;
  cartasPorRodada: number;
  necessidade: number;
  folga: number;
}

function formatarLinhas(decisao: DecisaoJogadaDebug): string {
  const fria = formatarLinha('Linha fria', decisao.linhaFria, decisao.motivoLinhaFria);
  const quente = formatarLinha('Linha quente', decisao.linhaQuente, decisao.motivoLinhaQuente);
  return `${fria} | ${quente}`;
}

const MOTIVO_NAO_REGISTRADO = 'motivo não registrado';

function formatarLinha(nome: string, carta: Carta, motivo: string | undefined): string {
  const textoMotivo = motivo ?? MOTIVO_NAO_REGISTRADO;
  return `${nome}: jogar ${formatarCarta(carta)} (${textoMotivo})`;
}

function formatarCarta(carta: Carta): string {
  return `${carta.valor}${carta.naipe}`;
}

function simNao(valor: boolean): string {
  return valor ? 'sim' : 'não';
}

function formatarSorteio(sorteio: number | undefined, quente: boolean, temperatura: number): string {
  if (sorteio === undefined) return 'Sorteio por temperatura: não ocorreu';
  const linha = quente ? 'quente' : 'fria';
  const comparacao = sorteio < temperatura ? 'sim' : 'não';
  return `Sorteio por temperatura: linha ${linha} (${sorteio.toFixed(2)} < T=${temperatura.toFixed(
    2,
  )}? ${comparacao} → linha ${linha})`;
}
