import type { Scene } from 'phaser';
import type { Jogador } from '@/types/entidades';
import { destruirDestaque, type EstadoDestaque } from '../renderers/destaque-renderer';
import { desenharFimJogo } from '../renderers/fim-jogo-renderer';
import { limparObjetos } from '../renderers/limpar-objetos';
import type { JogoScene } from './JogoScene';

interface ConfigFimJogoScene {
  cena: Scene;
  classificacao: Jogador[];
  fimJogoObjetos: Phaser.GameObjects.GameObject[];
  objetos: Phaser.GameObjects.GameObject[];
  mesaObjetos: Phaser.GameObjects.GameObject[];
  objetosDeclaracao: Phaser.GameObjects.GameObject[];
  painelObjetos: Phaser.GameObjects.GameObject[];
  destaque: EstadoDestaque;
  onReiniciar: () => void;
}

export function mostrarFimJogo(config: ConfigFimJogoScene): void {
  limparTelaDeJogo(config);
  desenharFimJogo({
    cena: config.cena,
    classificacao: config.classificacao,
    objetos: config.fimJogoObjetos,
    onReiniciar: config.onReiniciar,
  });
}

export function mostrarFimJogoDaCena(cena: JogoScene, classificacao: Jogador[]): void {
  mostrarFimJogo({
    cena,
    classificacao,
    fimJogoObjetos: cena.fimJogoObjetos,
    objetos: cena.objetos,
    mesaObjetos: cena.mesaObjetos,
    objetosDeclaracao: cena.objetosDeclaracao,
    painelObjetos: cena.painelObjetos,
    destaque: cena.destaque,
    onReiniciar: () => cena.scene.restart(),
  });
}

function limparTelaDeJogo(config: ConfigFimJogoScene): void {
  limparObjetos(config.objetos);
  limparObjetos(config.mesaObjetos);
  limparObjetos(config.objetosDeclaracao);
  limparObjetos(config.painelObjetos);
  destruirDestaque(config.destaque);
}
