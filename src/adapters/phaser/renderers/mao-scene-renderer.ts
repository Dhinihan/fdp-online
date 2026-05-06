import type { Scene } from 'phaser';
import type { Rodada } from '@/core/Rodada';
import type { MaoJogador } from '@/types/estado-rodada';
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
  rodada: Rodada;
  decisorHumano: DecisorHumano;
  destaque: EstadoDestaque;
  objetos: Phaser.GameObjects.GameObject[];
  labels: Phaser.GameObjects.Text[];
}

export function desenharMaoNaCena(config: ConfigDesenharMao): void {
  const { cena, mao, posicao, rodada, decisorHumano, destaque, objetos, labels } = config;
  const vazas = rodada.estado.vazas[mao.jogador.id] ?? 0;
  const texto = formatarLabelJogador(mao.jogador.nome, vazas, posicao.mao.direcao);
  const label = renderizarLabel({
    cena,
    x: posicao.labelX,
    y: posicao.labelY,
    texto,
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
      rodada,
      decisorHumano,
      destaque,
    });
  }
}
