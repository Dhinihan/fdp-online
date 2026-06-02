import type { Scene } from 'phaser';
import type { MetricaRanking, ParticipanteRankeado } from '@/store/ranking/ordenar-ranking';
import { escalar, escalarFonte } from '../escala';
import type { LayoutRanking } from './layout-ranking';
import { formatarMetricaRanking, rotuloCurtoMetricaRanking, type RankingRenderModel } from './ranking-view';

const COR_TEXTO = '#e8ecf5';
const COR_DIM = '#8b95ad';
const COR_ACENTO = '#facc15';
const COR_ACENTO_NUMERICA = 0xfacc15;
const COR_SUPERFICIE = 0x111827;
const COR_FITA = 0x2f80ed;
const COR_PRATA = 0xc0c6d4;
const COR_BRONZE = 0xc98a4b;

interface SlotPodio {
  item: ParticipanteRankeado;
  posicao: number;
  x: number;
}

interface EstatisticaCtx {
  slot: SlotPodio;
  metrica: MetricaRanking;
  y: number;
}

interface DesenhoSlotCtx {
  slot: SlotPodio;
  metrica: MetricaRanking;
  layout: LayoutRanking;
}

export function desenharPodioRanking(
  cena: Scene,
  model: RankingRenderModel,
  layout: LayoutRanking,
): Phaser.GameObjects.GameObject[] {
  return calcularSlots(cena, model.participantes, layout).flatMap((slot) =>
    desenharSlot(cena, { slot, metrica: model.metrica, layout }),
  );
}

function calcularSlots(cena: Scene, participantes: ParticipanteRankeado[], layout: LayoutRanking): SlotPodio[] {
  const top3 = participantes.slice(0, 3);
  const centro = cena.cameras.main.centerX;
  const intervalo = layout.podio.intervalo;
  if (top3.length === 1) return [{ item: top3[0], posicao: 1, x: centro }];
  if (top3.length === 2) {
    return top3.map((item, indice) => ({ item, posicao: indice + 1, x: centro + (indice - 0.5) * intervalo }));
  }
  return [
    { item: top3[1], posicao: 2, x: centro - intervalo },
    { item: top3[0], posicao: 1, x: centro },
    { item: top3[2], posicao: 3, x: centro + intervalo },
  ];
}

function desenharSlot(cena: Scene, ctx: DesenhoSlotCtx): Phaser.GameObjects.GameObject[] {
  const { slot, metrica, layout } = ctx;
  const yBase = layout.podio.topo + (slot.posicao === 1 ? 0 : escalar(14, cena));
  return [
    medalha(cena, slot, yBase),
    avatar(cena, slot, yBase + escalar(32, cena)),
    nome(cena, slot, yBase + escalar(78, cena)),
    estatistica(cena, { slot, metrica, y: yBase + escalar(98, cena) }),
  ];
}

function medalha(cena: Scene, slot: SlotPodio, y: number): Phaser.GameObjects.GameObject {
  const fita = cena.add.triangle(
    slot.x,
    y - escalar(5, cena),
    0,
    0,
    escalar(12, cena),
    0,
    escalar(6, cena),
    escalar(12, cena),
    COR_FITA,
  );
  const moeda = cena.add.circle(slot.x, y + escalar(5, cena), escalar(7, cena), corDaPosicao(slot.posicao), 1);
  const numero = cena.add
    .text(slot.x, y + escalar(5, cena), String(slot.posicao), {
      fontSize: escalarFonte(8, cena),
      color: '#1a1a2e',
      fontStyle: 'bold',
      fontFamily: 'Arial',
    })
    .setOrigin(0.5);
  return cena.add.container(0, 0, [fita, moeda, numero]);
}

function avatar(cena: Scene, slot: SlotPodio, y: number): Phaser.GameObjects.GameObject {
  const principal = slot.posicao === 1;
  const raio = escalar(principal ? 36 : 28, cena);
  const circulo = cena.add
    .circle(slot.x, y, raio, COR_SUPERFICIE, 1)
    .setStrokeStyle(escalar(2, cena), corDaPosicao(slot.posicao));
  const inicial = cena.add
    .text(slot.x, y, slot.item.nomeExibicao.charAt(0).toUpperCase(), {
      fontSize: escalarFonte(principal ? 26 : 20, cena),
      color: principal ? COR_ACENTO : COR_TEXTO,
      fontStyle: 'bold',
      fontFamily: 'Arial',
    })
    .setOrigin(0.5);
  return cena.add.container(0, 0, [circulo, inicial]);
}

function nome(cena: Scene, slot: SlotPodio, y: number): Phaser.GameObjects.Text {
  return cena.add
    .text(slot.x, y, slot.item.humano ? 'Você' : slot.item.nomeExibicao, {
      fontSize: escalarFonte(13, cena),
      color: slot.item.humano ? COR_ACENTO : COR_TEXTO,
      fontStyle: 'bold',
      fontFamily: 'Arial',
    })
    .setOrigin(0.5);
}

function estatistica(cena: Scene, ctx: EstatisticaCtx): Phaser.GameObjects.Text {
  return cena.add
    .text(ctx.slot.x, ctx.y, `${formatarMetricaRanking(ctx.slot.item, ctx.metrica)} ${rotuloMetrica(ctx.metrica)}`, {
      fontSize: escalarFonte(11, cena),
      color: COR_DIM,
      fontFamily: 'Arial',
    })
    .setOrigin(0.5);
}

function corDaPosicao(posicao: number): number {
  if (posicao === 1) return COR_ACENTO_NUMERICA;
  if (posicao === 2) return COR_PRATA;
  return COR_BRONZE;
}

function rotuloMetrica(metrica: MetricaRanking): string {
  return rotuloCurtoMetricaRanking(metrica);
}
