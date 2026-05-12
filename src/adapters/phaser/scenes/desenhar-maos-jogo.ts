import type { Scene } from 'phaser';
import type { Rodada } from '@/core/Rodada';
import type { MaoJogador } from '@/types/estado-rodada';
import type { DecisorHumano } from '../DecisorHumano';
import { obterDpr, escalar } from '../escala';
import { criarFundoInterativo } from '../input/input-humano';
import type { Retangulo } from '../layout';
import type { EstadoDestaque } from '../renderers/destaque-renderer';
import { desenharMaoNaCena } from '../renderers/mao-scene-renderer';
import { calcularPosicoes } from '../renderers/posicoes-mao';

interface ConfigMaosJogo {
  cena: Scene;
  rodada: Rodada;
  maos: MaoJogador[];
  gameArea: Retangulo;
  decisorHumano: DecisorHumano;
  destaque: EstadoDestaque;
  objetos: Phaser.GameObjects.GameObject[];
}

export function desenharMaosJogo(config: ConfigMaosJogo): {
  labels: Phaser.GameObjects.Text[];
  direcoes: ('horizontal' | 'vertical')[];
} {
  const labels: Phaser.GameObjects.Text[] = [];
  const quantidadesCartas = config.maos.map((mao) => mao.cartas.length);
  const posicoes = calcularPosicoesMaos(config.cena, config.gameArea, quantidadesCartas);
  config.maos.forEach((mao, i) => {
    desenharMaoNaCena({
      cena: config.cena,
      mao,
      posicao: posicoes[i],
      rodada: config.rodada,
      decisorHumano: config.decisorHumano,
      destaque: config.destaque,
      objetos: config.objetos,
      labels,
    });
  });
  criarFundoInterativo({
    cena: config.cena,
    objetos: config.objetos,
    gameArea: config.gameArea,
    decisorHumano: config.decisorHumano,
    destaque: config.destaque,
  });
  return { labels, direcoes: posicoes.map((p) => p.mao.direcao) };
}

function calcularPosicoesMaos(
  cena: Scene,
  gameArea: Retangulo,
  quantidadesCartas: number[],
): ReturnType<typeof calcularPosicoes> {
  return calcularPosicoes({
    gameArea,
    margem: escalar(60, cena),
    margemInferior: escalar(80, cena),
    espacamentoHorizontal: escalar(18, cena),
    espacamentoVertical: escalar(6, cena),
    alturaCarta: escalar(75, cena),
    quantidadesCartas,
    dpr: obterDpr(cena),
  });
}
