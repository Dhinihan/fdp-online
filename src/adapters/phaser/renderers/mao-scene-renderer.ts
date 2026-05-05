import type { Scene } from 'phaser';
import type { Partida } from '@/core/Partida';
import type { MaoJogador } from '@/types/estado-partida';
import type { DecisorHumano } from '../DecisorHumano';
import { configurarInteracaoHumano } from '../input/input-humano';
import type { EstadoDestaque } from './destaque-renderer';
import { formatarLabelJogador } from './label-jogador';
import { renderizarLabel, renderizarMao } from './mao-renderer';
import type { PosicaoTela } from './posicoes-mao';

export interface ConfigDesenharMao {
  cena: Scene;
  mao: MaoJogador;
  posicao: PosicaoTela;
  partida: Partida;
  decisorHumano: DecisorHumano;
  destaque: EstadoDestaque;
  objetos: Phaser.GameObjects.GameObject[];
  labels: Phaser.GameObjects.Text[];
}

export function desenharMaoNaCena(config: ConfigDesenharMao): void {
  const { cena, mao, posicao, partida, decisorHumano, destaque, objetos, labels } = config;
  const vazas = partida.estado.vazas[mao.jogador.id] ?? 0;
  const texto = formatarLabelJogador(mao.jogador.nome, vazas, posicao.mao.direcao);
  const label = renderizarLabel({
    cena,
    x: posicao.labelX,
    y: posicao.labelY,
    texto,
    origem: posicao.origemLabel,
  }).setDepth(10);
  objetos.push(label);
  labels.push(label);
  const objetosMao = renderizarMao({ cena, posicao: posicao.mao, cartas: mao.cartas, visivel: mao.visivel });
  objetos.push(...objetosMao);
  if (mao.jogador.id === 'humano') {
    configurarInteracaoHumano({
      cena,
      objetosMao,
      cartas: mao.cartas,
      partida,
      decisorHumano,
      destaque,
    });
  }
}
