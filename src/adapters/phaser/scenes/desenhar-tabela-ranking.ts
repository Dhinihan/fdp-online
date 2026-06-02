import type { Scene } from 'phaser';
import { ordenarRanking, type MetricaRanking, type ParticipanteRankeado } from '@/store/ranking/ordenar-ranking';
import type { ParticipanteRanking } from '@/store/ranking/tipos';
import { escalar, escalarFonte } from '../escala';

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

const MAX_FAIXA = 600;
const COL_METRICA = 84;
const GAP = 6;

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

export function desenharTabelaRanking(
  cena: Scene,
  participantes: ParticipanteRanking[],
  metrica: MetricaRanking,
): Phaser.GameObjects.GameObject[] {
  const pincel: Pincel = { cena, layout: calcularLayout(cena) };
  const ordenados = ordenarRanking(participantes, metrica);
  const objetos = desenharCabecalho(pincel);
  ordenados.forEach((item, indice) => {
    const y = pincel.layout.topo + escalar(34, cena) + indice * pincel.layout.alturaLinha;
    objetos.push(...desenharLinha(pincel, { item, indice, y, metrica }));
  });
  return objetos;
}

function calcularLayout(cena: Scene): LayoutTabela {
  const { width } = cena.cameras.main;
  const margem = escalar(16, cena);
  const larguraFaixa = Math.min(width - margem * 2, escalar(MAX_FAIXA, cena));
  const esquerda = (width - larguraFaixa) / 2;
  return {
    esquerda,
    direita: esquerda + larguraFaixa - escalar(12, cena),
    larguraColuna: escalar(COL_METRICA, cena),
    gap: escalar(GAP, cena),
    alturaLinha: escalar(64, cena),
    topo: escalar(122, cena),
  };
}

function colunaX(layout: LayoutTabela, ordemDireita: number): number {
  return layout.direita - ordemDireita * (layout.larguraColuna + layout.gap);
}

function desenharCabecalho({ cena, layout }: Pincel): Phaser.GameObjects.GameObject[] {
  const y = layout.topo;
  const estilo = { fontSize: escalarFonte(10, cena), color: COR_DIM, fontFamily: 'Arial' };
  const titulo = cena.add.text(layout.esquerda, y, 'Participante', estilo).setOrigin(0, 0.5);
  const cabecalhos = ['Vitórias', 'Win rate', 'Pos. média'].map((rotulo, coluna) =>
    cena.add.text(colunaX(layout, 2 - coluna), y, rotulo, estilo).setOrigin(1, 0.5),
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
  const valores = [String(ctx.item.vitorias), `${String(ctx.item.winRate)}%`, ctx.item.posMedia.toFixed(1)];
  const metricasRanking: MetricaRanking[] = ['vitorias', 'winRate', 'posMedia'];
  return valores.map((valor, coluna) =>
    cena.add
      .text(colunaX(layout, 2 - coluna), ctx.y, valor, {
        fontSize: escalarFonte(15, cena),
        color: metricasRanking[coluna] === ctx.metrica ? COR_ACENTO : COR_TEXTO,
        fontStyle: 'bold',
        fontFamily: 'Arial',
      })
      .setOrigin(1, 0.5),
  );
}
