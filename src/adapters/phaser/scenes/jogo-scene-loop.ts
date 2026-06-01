import type { Scene } from 'phaser';
import type { Rodada } from '@/core/Rodada';
import type { Jogador } from '@/types/entidades';
import { ehFaseDeclaracao, estadoEmJogo } from '@/types/estado-rodada';
import type { DecisorDeclaracaoHumano } from '../DecisorDeclaracaoHumano';
import type { Retangulo } from '../layout';
import { desenharBotoesDeclaracao, limparObjetosDeclaracao } from '../renderers/declaracao-renderer';
import { atualizarLabelVencedor } from '../renderers/label-jogador';

interface ConfigDeclaracoes {
  cena: Scene;
  rodada: Rodada;
  objetos: Phaser.GameObjects.GameObject[];
  decisorHumano: DecisorDeclaracaoHumano;
  getGameArea: () => Retangulo;
  getValorDeclaracao: () => number;
  onAlterarDeclaracao: (valor: number) => void;
  atualizarIndicadorVez: () => void;
  atualizarPainel: () => void;
  renderizarBadges: (jogadorIdAnimar?: string) => void;
  limparBadges: () => void;
  iniciarTurnos: () => Promise<void>;
}

const ESPERA_APOS_DECLARACAO_BOT_MS = 650;
/** Pausa com todos os badges visíveis antes do turno 1 de jogada. */
const ESPERA_ANTES_PRIMEIRO_TURNO_MS = 1400;

interface ConfigTurnos {
  cena: Scene;
  rodada: Rodada;
  getLabels: () => Phaser.GameObjects.Text[];
  getDirecoesLabels: () => ('horizontal' | 'vertical')[];
  turnoAnteriorRef: { valor: number };
  jogadores: Jogador[];
  getVencedorTurno: () => string | undefined;
  animarRecolhimento: () => void;
  atualizarIndicadorVez: () => void;
  atualizarPainel: () => void;
}

export async function processarDeclaracoes(config: ConfigDeclaracoes): Promise<void> {
  const { rodada } = config;
  while (ehFaseDeclaracao(rodada.estado.fase)) {
    await prepararDeclaracaoAtual(config);
    const declaradorId = obterJogadorAtualId(rodada);
    const declarou = await tentarDeclarar(rodada);
    if (!declarou) return;
    limparObjetosDeclaracao(config.objetos);
    const fimDeclaracao = rodada.estado.fase === 'aguardandoJogada';
    config.renderizarBadges(declaradorId);
    config.atualizarPainel();
    config.atualizarIndicadorVez();
    if (declaradorId !== 'humano' || fimDeclaracao) {
      await esperar(config.cena, ESPERA_APOS_DECLARACAO_BOT_MS);
    }
  }
  if (rodada.estado.fase === 'aguardandoJogada') {
    await esperar(config.cena, ESPERA_ANTES_PRIMEIRO_TURNO_MS);
    config.limparBadges();
    void config.iniciarTurnos().catch(() => undefined);
  }
}

async function prepararDeclaracaoAtual(config: ConfigDeclaracoes): Promise<void> {
  const { cena, rodada } = config;
  const emJogo = estadoEmJogo(rodada.estado);
  const maoAtual = emJogo.maos[emJogo.jogadorAtual];
  if (maoAtual.jogador.id !== 'humano') {
    await esperar(cena, 400);
    return;
  }
  limparObjetosDeclaracao(config.objetos);
  desenharBotoesDeclaracao({
    cena,
    maximo: emJogo.cartasPorRodada,
    objetos: config.objetos,
    gameArea: config.getGameArea(),
    valorInicial: config.getValorDeclaracao(),
    onAlterar: config.onAlterarDeclaracao,
    onSelecionar: (valor: number) => {
      config.decisorHumano.confirmar(valor);
    },
  });
}

export async function iniciarProcessamentoTurno(config: ConfigTurnos): Promise<void> {
  const { rodada } = config;
  while (rodada.estado.fase !== 'rodadaConcluida') {
    await aguardarBotAtual(config);
    const jogou = await tentarJogarTurno(rodada);
    if (!jogou) return;
    await atualizarFimDeTurno(config);
    config.atualizarIndicadorVez();
  }
}

async function aguardarBotAtual(config: ConfigTurnos): Promise<void> {
  const emJogo = estadoEmJogo(config.rodada.estado);
  const maoAtual = emJogo.maos[emJogo.jogadorAtual];
  if (maoAtual.jogador.id !== 'humano') await esperar(config.cena, 500);
}

async function atualizarFimDeTurno(config: ConfigTurnos): Promise<void> {
  const { rodada, turnoAnteriorRef } = config;
  const emJogo = estadoEmJogo(rodada.estado);
  if (emJogo.turno <= turnoAnteriorRef.valor) return;
  turnoAnteriorRef.valor = emJogo.turno;
  const vencedorId = config.getVencedorTurno();
  config.animarRecolhimento();
  await esperar(config.cena, 800);
  config.atualizarPainel();
  atualizarLabelVencedor({
    vencedorId,
    jogadores: config.jogadores,
    vazas: emJogo.vazas,
    labels: config.getLabels(),
    direcoes: config.getDirecoesLabels(),
  });
}

function obterJogadorAtualId(rodada: Rodada): string {
  const emJogo = estadoEmJogo(rodada.estado);
  return emJogo.maos[emJogo.jogadorAtual].jogador.id;
}

async function tentarDeclarar(rodada: Rodada): Promise<boolean> {
  try {
    await rodada.declarar();
    return true;
  } catch {
    return false;
  }
}

async function tentarJogarTurno(rodada: Rodada): Promise<boolean> {
  try {
    await rodada.jogarTurno();
    return true;
  } catch {
    return false;
  }
}

function esperar(cena: Scene, ms: number): Promise<void> {
  return new Promise((resolve) => {
    cena.time.delayedCall(ms, resolve);
  });
}
