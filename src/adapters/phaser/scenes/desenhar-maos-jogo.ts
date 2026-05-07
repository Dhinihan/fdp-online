import type { Rodada } from '@/core/Rodada';
import type { MaoJogador } from '@/types/estado-rodada';
import type { DecisorHumano } from '../DecisorHumano';
import { obterDpr, escalar } from '../escala';
import type { EstadoDestaque } from '../renderers/destaque-renderer';
import { desenharMaoNaCena } from '../renderers/mao-scene-renderer';
import { calcularPosicoes } from '../renderers/posicoes-mao';

interface ConfigDesenharMaos {
  cena: Phaser.Scene;
  maos: MaoJogador[];
  rodada: Rodada;
  decisorHumano: DecisorHumano;
  destaque: EstadoDestaque;
  objetos: Phaser.GameObjects.GameObject[];
  labels: Phaser.GameObjects.Text[];
}

export function desenharMaosJogo(config: ConfigDesenharMaos): ('horizontal' | 'vertical')[] {
  const posicoes = calcularPosicoes({
    largura: config.cena.cameras.main.width,
    altura: config.cena.cameras.main.height,
    margem: escalar(60, config.cena),
    margemInferior: escalar(80, config.cena),
    espacamentoCartas: escalar(40, config.cena),
    alturaCarta: escalar(75, config.cena),
    dpr: obterDpr(config.cena),
  });
  config.maos.forEach((mao, i) => {
    desenharMaoNaCena({ ...config, mao, posicao: posicoes[i] });
  });
  return posicoes.map((p) => p.mao.direcao);
}
