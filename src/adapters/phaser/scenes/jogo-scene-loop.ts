import type { Scene } from 'phaser';
import type { Rodada } from '@/core/Rodada';
import type { Jogador } from '@/types/entidades';
import { estadoEmJogo } from '@/types/estado-rodada';
import type { DecisorDeclaracaoHumano } from '../DecisorDeclaracaoHumano';
import type { Retangulo } from '../layout';
import { desenharBotoesDeclaracao, limparObjetosDeclaracao } from '../renderers/declaracao-renderer';
import { atualizarLabelVencedor } from '../renderers/label-jogador';

interface ConfigDeclaracoes {
  cena: Scene;
  rodada: Rodada;
  objetos: Phaser.GameObjects.GameObject[];
  decisorHumano: DecisorDeclaracaoHumano;
  gameArea: Retangulo;
  atualizarIndicadorVez: () => void;
  atualizarPainel: () => void;
  iniciarTurnos: () => Promise<void>;
}

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
}

export async function processarDeclaracoes(config: ConfigDeclaracoes): Promise<void> {
  const { rodada } = config;
  while (faseDeclaracao(rodada)) {
    await prepararDeclaracaoAtual(config);
    const declarou = await tentarDeclarar(rodada);
    if (!declarou) return;
    limparObjetosDeclaracao(config.objetos);
    config.atualizarPainel();
    config.atualizarIndicadorVez();
  }
  if (rodada.estado.fase === 'aguardandoJogada') {
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
    gameArea: config.gameArea,
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
  atualizarLabelVencedor({
    vencedorId,
    jogadores: config.jogadores,
    vazas: emJogo.vazas,
    labels: config.getLabels(),
    direcoes: config.getDirecoesLabels(),
  });
}

function faseDeclaracao(rodada: Rodada): boolean {
  return rodada.estado.fase === 'aguardandoDeclaracao' || rodada.estado.fase === 'processandoDeclaracao';
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
