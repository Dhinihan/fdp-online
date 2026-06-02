import type { Scene } from 'phaser';
import type { MetricaRanking, ParticipanteRankeado } from '@/store/ranking/ordenar-ranking';
import { escalar, escalarFonte } from '../escala';
import { calcularGeometriaLista, type GeometriaListaRanking } from './geometria-rolagem-tabela-ranking';
import type { LayoutRanking } from './layout-ranking';
import { formatarMetricaRanking, OPCOES_METRICA_RANKING, type RankingRenderModel } from './ranking-view';

/**
 * Tabela de participantes do Ranking, posicionada por coordenada (sem layout
 * CSS), espelhando o protótipo validado: faixa central de largura máxima fixa,
 * colunas de métrica à direita, `partidas: N` sob o nome, `Você` em dourado e
 * destaque visual na métrica ativa.
 */

const COR_TEXTO = '#e8ecf5';
const COR_DIM = '#8b95ad';
const COR_ACENTO = '#facc15';
const COR_VERDE = '#4ecca3';
const COR_LINHA_FUNDO = 0x111827;
const COR_LIDER = 0x4ecca3;

interface LayoutTabela {
  esquerda: number;
  direita: number;
  larguraColuna: number;
  gap: number;
  alturaLinha: number;
  topo: number;
}

/** Pincel = cena + geometria já calculada, para manter as funções com ≤3 params. */
interface Pincel {
  cena: Scene;
  layout: LayoutTabela;
}

/**
 * Resultado da tabela já separado em duas partes: `cabecalho` fica fixo na
 * cena; `linhas` é o que a `RankingScene` põe num container mascarado para
 * rolar (#249). `geometria` traz a região retangular do corpo da tabela e as
 * alturas visível/total — contrato fechado da viewport, sem a cena recomputar
 * pedaços por fora.
 */
export interface TabelaRankingRender {
  cabecalho: Phaser.GameObjects.GameObject[];
  linhas: Phaser.GameObjects.GameObject[];
  geometria: GeometriaListaRanking;
}

export function desenharTabelaRanking(
  cena: Scene,
  model: RankingRenderModel,
  layoutRanking: LayoutRanking,
): TabelaRankingRender {
  const pincel: Pincel = { cena, layout: layoutTabela(layoutRanking) };
  const { alturaLinha } = pincel.layout;
  const inicio = pincel.layout.topo + escalar(34, cena);
  const linhas = model.participantes.flatMap((item, indice) =>
    desenharLinha(pincel, { item, indice, y: inicio + indice * alturaLinha, metrica: model.metrica }),
  );
  return {
    cabecalho: desenharCabecalho(pincel),
    linhas,
    geometria: calcularGeometriaLista({
      esquerda: pincel.layout.esquerda,
      direita: pincel.layout.direita + escalar(12, cena),
      primeiraLinhaTopo: inicio - alturaLinha / 2,
      fundo: cena.cameras.main.height - escalar(18, cena),
      alturaLinha,
      totalLinhas: model.participantes.length,
    }),
  };
}

function layoutTabela(layout: LayoutRanking): LayoutTabela {
  return {
    esquerda: layout.faixa.esquerda,
    direita: layout.tabela.direita,
    larguraColuna: layout.tabela.larguraColuna,
    gap: layout.tabela.gap,
    alturaLinha: layout.tabela.alturaLinha,
    topo: layout.tabela.topo,
  };
}

function colunaX(layout: LayoutTabela, ordemDireita: number): number {
  return layout.direita - ordemDireita * (layout.larguraColuna + layout.gap);
}

function desenharCabecalho({ cena, layout }: Pincel): Phaser.GameObjects.GameObject[] {
  const y = layout.topo;
  const estilo = { fontSize: escalarFonte(10, cena), color: COR_DIM, fontFamily: 'Arial' };
  const titulo = cena.add.text(layout.esquerda, y, 'Participante', estilo).setOrigin(0, 0.5);
  const cabecalhos = OPCOES_METRICA_RANKING.map((opcao, coluna) =>
    cena.add.text(colunaX(layout, 2 - coluna), y, opcao.rotulo, estilo).setOrigin(1, 0.5),
  );
  return [titulo, ...cabecalhos];
}

interface LinhaCtx {
  item: ParticipanteRankeado;
  indice: number;
  y: number;
  metrica: MetricaRanking;
}

function desenharLinha(pincel: Pincel, ctx: LinhaCtx): Phaser.GameObjects.GameObject[] {
  const lider = ctx.indice === 0;
  return [
    fundoLinha(pincel, ctx.y, lider),
    posicao(pincel, { y: ctx.y, numero: ctx.indice + 1, lider }),
    ...identidade(pincel, ctx.y, ctx.item),
    ...metricas(pincel, ctx),
  ];
}

function fundoLinha({ cena, layout }: Pincel, y: number, lider: boolean): Phaser.GameObjects.GameObject {
  const largura = layout.direita - layout.esquerda + escalar(12, cena);
  const altura = layout.alturaLinha - escalar(8, cena);
  const fundo = cena.add.rectangle(layout.esquerda, y, largura, altura, COR_LINHA_FUNDO, 1).setOrigin(0, 0.5);
  if (lider) fundo.setStrokeStyle(escalar(1, cena), COR_LIDER);
  return fundo;
}

function posicao(
  { cena, layout }: Pincel,
  ctx: { y: number; numero: number; lider: boolean },
): Phaser.GameObjects.GameObject {
  return cena.add
    .text(layout.esquerda + escalar(16, cena), ctx.y, String(ctx.numero), {
      fontSize: escalarFonte(15, cena),
      color: ctx.lider ? COR_VERDE : COR_DIM,
      fontStyle: 'bold',
      fontFamily: 'Arial',
    })
    .setOrigin(0.5);
}

function identidade({ cena, layout }: Pincel, y: number, item: ParticipanteRankeado): Phaser.GameObjects.GameObject[] {
  const x = layout.esquerda + escalar(40, cena);
  const rotulo = item.humano ? 'Você' : item.nomeExibicao;
  const nome = cena.add
    .text(x, y - escalar(8, cena), rotulo, {
      fontSize: escalarFonte(15, cena),
      color: item.humano ? COR_ACENTO : COR_TEXTO,
      fontStyle: 'bold',
      fontFamily: 'Arial',
    })
    .setOrigin(0, 0.5);
  const partidas = cena.add
    .text(x, y + escalar(10, cena), `partidas: ${String(item.partidas)}`, {
      fontSize: escalarFonte(10, cena),
      color: COR_DIM,
      fontFamily: 'Arial',
    })
    .setOrigin(0, 0.5);
  return [nome, partidas];
}

function metricas({ cena, layout }: Pincel, ctx: LinhaCtx): Phaser.GameObjects.GameObject[] {
  const valores = OPCOES_METRICA_RANKING.map((opcao) => formatarMetricaRanking(ctx.item, opcao.chave));
  return valores.map((valor, coluna) =>
    cena.add
      .text(colunaX(layout, 2 - coluna), ctx.y, valor, {
        fontSize: escalarFonte(15, cena),
        color: OPCOES_METRICA_RANKING[coluna]?.chave === ctx.metrica ? COR_ACENTO : COR_TEXTO,
        fontStyle: 'bold',
        fontFamily: 'Arial',
      })
      .setOrigin(1, 0.5),
  );
}
