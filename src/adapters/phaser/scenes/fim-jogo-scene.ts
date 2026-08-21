import type { Scene } from 'phaser';
import type { ResultadoTrofeus } from '@/store/trofeus/tipos';
import type { Jogador } from '@/types/entidades';
import { destruirDestaque, type EstadoDestaque } from '../renderers/destaque-renderer';
import { desenharFimJogo } from '../renderers/fim-jogo-renderer';
import { limparObjetos } from '../renderers/limpar-objetos';
import type { JogoScene } from './JogoScene';

interface ConfigFimJogoScene {
  cena: Scene;
  classificacao: Jogador[];
  resultadoTrofeus: ResultadoTrofeus | null;
  fimJogoObjetos: Phaser.GameObjects.GameObject[];
  objetos: Phaser.GameObjects.GameObject[];
  mesaObjetos: Phaser.GameObjects.GameObject[];
  objetosDeclaracao: Phaser.GameObjects.GameObject[];
  painelObjetos: Phaser.GameObjects.GameObject[];
  destaque: EstadoDestaque;
  onReiniciar: () => void;
  onFeedback: () => void;
  /** Primeira exibição (transição jogo→fim) vs. re-render por resize. */
  primeiraExibicao: boolean;
}

export function mostrarFimJogo(config: ConfigFimJogoScene): void {
  // O tabuleiro só precisa ser limpo na transição jogo→fim; no re-render por
  // resize ele já está vazio e a tela de fim de jogo apenas se reposiciona.
  if (config.primeiraExibicao) limparTelaDeJogo(config);
  desenharFimJogo({
    cena: config.cena,
    classificacao: config.classificacao,
    resultadoTrofeus: config.resultadoTrofeus,
    objetos: config.fimJogoObjetos,
    onReiniciar: config.onReiniciar,
    onFeedback: config.onFeedback,
    animar: config.primeiraExibicao,
  });
}

export interface EstadoFimJogo {
  classificacao: Jogador[];
  resultadoTrofeus: ResultadoTrofeus | null;
}

export function mostrarFimJogoDaCena(cena: JogoScene, estado: EstadoFimJogo, primeiraExibicao: boolean): void {
  mostrarFimJogo({
    cena,
    classificacao: estado.classificacao,
    resultadoTrofeus: estado.resultadoTrofeus,
    fimJogoObjetos: cena.fimJogoObjetos,
    objetos: cena.objetos,
    mesaObjetos: cena.mesaObjetos,
    objetosDeclaracao: cena.objetosDeclaracao,
    painelObjetos: cena.painelObjetos,
    destaque: cena.destaque,
    onReiniciar: () => cena.scene.restart(),
    onFeedback: cena.mostrarFeedbackFim,
    primeiraExibicao,
  });
}

function limparTelaDeJogo(config: ConfigFimJogoScene): void {
  limparObjetos(config.objetos);
  limparObjetos(config.mesaObjetos);
  limparObjetos(config.objetosDeclaracao);
  limparObjetos(config.painelObjetos);
  destruirDestaque(config.destaque);
}
