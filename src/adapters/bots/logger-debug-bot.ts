import { avaliarCartas, type CartaAvaliada } from '@/core/avaliador-carta';
import type { Carta } from '@/core/Carta';
import { estadoEmJogo, type EstadoRodada, type MesaItem } from '@/types/estado-rodada';
/* eslint-disable no-console */

export interface LoggerDebugBot {
  registrarDeclaracao(decisao: DecisaoDeclaracaoDebug): void;
  registrarJogada(decisao: DecisaoJogadaDebug): void;
}

export interface DecisaoDeclaracaoDebug {
  mao: CartaAvaliada[];
  seguras: number;
  altas: number;
  sorteouAlta: boolean;
  defensivo: boolean;
  declaracao: number;
}

export interface DecisaoJogadaDebug {
  estado: EstadoRodada;
  mao: Carta[];
  linhaFria: Carta;
  linhaQuente: Carta;
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
  console.log(`Mão: [${formatarAvaliadas(decisao.mao)}]`);
  console.log(formatarContagens(decisao));
  console.log(`→ Declarou: ${decisao.declaracao.toString()}`);
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
  console.log('Bifurcação: segurança para cumprir depois ✓, pressão disponível ✓');
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
  const seguras = decisao.seguras.toString();
  const altas = decisao.altas.toString();
  return `Seguras: ${seguras} | Altas consideradas: ${altas} (sorteou: ${simNao(
    decisao.sorteouAlta,
  )}) | +1 defensivo: ${simNao(decisao.defensivo)}`;
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
  return `Linha fria: jogar ${formatarCarta(decisao.linhaFria)} | Linha quente: jogar ${formatarCarta(
    decisao.linhaQuente,
  )}`;
}

function formatarCarta(carta: Carta): string {
  return `${carta.valor}${carta.naipe}`;
}

function simNao(valor: boolean): string {
  return valor ? 'sim' : 'não';
}

function formatarSorteio(sorteio: number | undefined, quente: boolean, temperatura: number): string {
  if (sorteio === undefined) return `RNG sorteou: ${quente ? 'quente' : 'fria'}`;
  const linha = quente ? 'quente' : 'fria';
  const comparacao = sorteio < temperatura ? 'sim' : 'não';
  return `RNG sorteou: ${linha} (${sorteio.toFixed(2)} < T=${temperatura.toFixed(2)}? ${comparacao} → ${linha})`;
}
