import type { Scene } from 'phaser';
import type { Nivel } from '@/store/trofeus/tabela-trofeus';

/**
 * Arte vetorial do Troféu, desenhada em Phaser puro (adapter — validação visual,
 * sem Vitest; AGENTS.md §3). Conta a progressão dos sete níveis pela cor:
 *
 * - **Metais** (Bronze, Prata, Ouro): a taça inteira na cor do metal.
 * - **Pedras** (Esmeralda, Safira, Rubi, Diamante): taça de ouro com a gema
 *   engravada na cor da pedra — visualmente "depois" dos metais. A gema é
 *   facetada (topo claro / base escura) com um brilho, para ler como joia.
 *
 * Cada nível é classificado uma única vez em {@link COR_METAL} ou {@link COR_GEMA}
 * (a cobertura de todos os níveis é checada em tempo de compilação), e tudo o
 * mais — `ehPedra`, a cor do corpo, a gema — deriva daí. `desenharTrofeuArte`
 * desenha a taça inteira; `desenharCristalTrofeu` desenha só o cristal e só
 * aceita níveis de pedra, então não há combinação inválida possível.
 *
 * O ouro é um tom escurecido (compartilhado por Ouro e por todas as pedras), com
 * um filete claro na boca da taça para não chapar. `aceso: false` apaga o Troféu
 * (cinza esmaecido) para os níveis bloqueados do overlay, preservando a
 * silhueta. Cada função retorna um Container centrado em (x, y); a geometria
 * ocupa cerca de `tamanho` na vertical.
 */

const COR_OURO = 0xd4951f;
const COR_BLOQUEADO = 0x4b5572;
const COR_CONTORNO = 0x1a2138;
const ESCALA_GEMA = 1.55;
/** A gema sozinha (`desenharCristalTrofeu`) cresce para preencher o lugar da taça. */
const ESCALA_GEMA_SOLO = 4;

interface CorGema {
  cor: number;
  topo: number;
}

type VisualNivel = { tipo: 'metal'; cor: number } | { tipo: 'pedra'; gema: CorGema };

// Fonte única da classificação visual. `satisfies Record<Nivel, ...>` obriga a
// cobrir os sete níveis: um Nível novo sem entrada aqui não compila — não há
// fallback silencioso. `Pedra` e tudo o mais derivam deste mapa.
const VISUAL = {
  bronze: { tipo: 'metal', cor: 0xcd7f32 },
  prata: { tipo: 'metal', cor: 0xc0c6d4 },
  ouro: { tipo: 'metal', cor: COR_OURO },
  esmeralda: { tipo: 'pedra', gema: { cor: 0x12a150, topo: 0x86efac } },
  safira: { tipo: 'pedra', gema: { cor: 0x2563eb, topo: 0x7cb0ff } },
  rubi: { tipo: 'pedra', gema: { cor: 0xdc2626, topo: 0xfb9a9a } },
  diamante: { tipo: 'pedra', gema: { cor: 0x9cc3ea, topo: 0xffffff } },
} as const satisfies Record<Nivel, VisualNivel>;

/** Níveis de pedra, derivados do mapa: garante que o cristal só receba pedras. */
export type Pedra = { [K in Nivel]: (typeof VISUAL)[K]['tipo'] extends 'pedra' ? K : never }[Nivel];

/** Pedras (têm gema engravada) vs. metais (taça lisa). */
export function ehPedra(nivel: Nivel): nivel is Pedra {
  return VISUAL[nivel].tipo === 'pedra';
}

/** Cor do corpo da taça: a do metal, ou ouro para qualquer pedra. */
function corCorpo(nivel: Nivel): number {
  const v = VISUAL[nivel];
  return v.tipo === 'metal' ? v.cor : COR_OURO;
}

export interface OpcoesTrofeuArte {
  x: number;
  y: number;
  /** Altura aproximada da arte em pixels físicos (o chamador já escala). */
  tamanho: number;
  nivel: Nivel;
  /** `false` apaga o Troféu (nível bloqueado); padrão `true`. */
  aceso?: boolean;
}

export interface OpcoesCristalTrofeu {
  x: number;
  y: number;
  tamanho: number;
  /** Só pedras têm cristal; o tipo impede passar um metal. */
  nivel: Pedra;
}

interface PinturaTaca {
  t: number;
  cor: number;
  /** Filete claro na boca da taça; ausente quando o Troféu está apagado. */
  rim?: number;
}

export function desenharTrofeuArte(cena: Scene, opcoes: OpcoesTrofeuArte): Phaser.GameObjects.Container {
  const aceso = opcoes.aceso ?? true;
  const t = opcoes.tamanho;
  const cor = aceso ? corCorpo(opcoes.nivel) : COR_BLOQUEADO;
  const v = VISUAL[opcoes.nivel];
  const gema = aceso && v.tipo === 'pedra' ? v.gema : undefined;
  const g = cena.add.graphics();
  desenharAlcas(g, t, cor);
  desenharTaca(g, { t, cor, rim: aceso ? clarear(cor, 0.5) : undefined });
  desenharPe(g, t, cor);
  if (gema !== undefined) desenharGema(g, { t, gema, cy: -0.25 * t, escala: ESCALA_GEMA });
  // Centraliza verticalmente: a silhueta vai de -0.46t (boca) a 0.29t (pé).
  g.setY(t * 0.085);
  return cena.add.container(opcoes.x, opcoes.y, [g]).setAlpha(aceso ? 1 : 0.5);
}

/** Só o cristal do nível, sem a taça (usado no resumo do Ranking para pedras). */
export function desenharCristalTrofeu(cena: Scene, opcoes: OpcoesCristalTrofeu): Phaser.GameObjects.Container {
  const g = cena.add.graphics();
  desenharGema(g, { t: opcoes.tamanho, gema: VISUAL[opcoes.nivel].gema, cy: 0, escala: ESCALA_GEMA_SOLO });
  return cena.add.container(opcoes.x, opcoes.y, [g]);
}

function desenharTaca(g: Phaser.GameObjects.Graphics, { t, cor, rim }: PinturaTaca): void {
  const pts = [
    { x: -0.3 * t, y: -0.46 * t },
    { x: 0.3 * t, y: -0.46 * t },
    { x: 0.24 * t, y: -0.3 * t },
    { x: 0.16 * t, y: -0.14 * t },
    { x: 0.12 * t, y: -0.05 * t },
    { x: -0.12 * t, y: -0.05 * t },
    { x: -0.16 * t, y: -0.14 * t },
    { x: -0.24 * t, y: -0.3 * t },
  ];
  g.fillStyle(cor, 1);
  g.lineStyle(Math.max(1, t * 0.03), COR_CONTORNO, 0.5);
  g.fillPoints(pts, true);
  g.strokePoints(pts, true);
  if (rim !== undefined) {
    g.lineStyle(Math.max(1, t * 0.02), rim, 0.9);
    g.lineBetween(-0.3 * t, -0.46 * t, 0.3 * t, -0.46 * t);
  }
  g.fillStyle(cor, 1);
  g.fillRect(-0.05 * t, -0.06 * t, 0.1 * t, 0.16 * t);
}

function desenharAlcas(g: Phaser.GameObjects.Graphics, t: number, cor: number): void {
  g.lineStyle(Math.max(2, t * 0.06), cor, 1);
  g.beginPath();
  g.arc(-0.28 * t, -0.34 * t, 0.13 * t, Math.PI * 0.5, Math.PI * 1.5, false);
  g.strokePath();
  g.beginPath();
  g.arc(0.28 * t, -0.34 * t, 0.13 * t, -Math.PI * 0.5, Math.PI * 0.5, false);
  g.strokePath();
}

function desenharPe(g: Phaser.GameObjects.Graphics, t: number, cor: number): void {
  g.fillStyle(cor, 1);
  g.fillRect(-0.13 * t, 0.1 * t, 0.26 * t, 0.05 * t);
  g.fillPoints(
    [
      { x: -0.16 * t, y: 0.15 * t },
      { x: 0.16 * t, y: 0.15 * t },
      { x: 0.22 * t, y: 0.29 * t },
      { x: -0.22 * t, y: 0.29 * t },
    ],
    true,
  );
}

interface DesenhoGema {
  t: number;
  gema: CorGema;
  /** Centro vertical da gema (a taça usa -0.25t; sozinha, 0). */
  cy: number;
  escala: number;
}

function desenharGema(g: Phaser.GameObjects.Graphics, d: DesenhoGema): void {
  const { t, gema, cy, escala } = d;
  const gw = 0.08 * t * escala;
  const gh = 0.09 * t * escala;
  const pts = [
    { x: 0, y: cy - gh },
    { x: gw, y: cy },
    { x: 0, y: cy + gh },
    { x: -gw, y: cy },
  ];
  g.fillStyle(gema.cor, 1);
  g.fillPoints(pts, true);
  g.fillStyle(gema.topo, 1);
  g.fillPoints([pts[3], pts[0], pts[1]], true);
  g.lineStyle(Math.max(1, t * 0.02), 0xffffff, 0.7);
  g.strokePoints(pts, true);
  desenharBrilho(g, { x: -gw * 0.35, y: cy - gh * 0.35, r: gw * 0.25 });
}

function desenharBrilho(g: Phaser.GameObjects.Graphics, brilho: { x: number; y: number; r: number }): void {
  const { x, y, r } = brilho;
  g.fillStyle(0xffffff, 0.95);
  g.fillPoints(
    [
      { x, y: y - r },
      { x: x + r * 0.3, y },
      { x, y: y + r },
      { x: x - r * 0.3, y },
    ],
    true,
  );
  g.fillPoints(
    [
      { x: x - r, y },
      { x, y: y - r * 0.3 },
      { x: x + r, y },
      { x, y: y + r * 0.3 },
    ],
    true,
  );
}

/** Mistura a cor em direção ao branco por `fator` (0 = cor, 1 = branco). */
function clarear(cor: number, fator: number): number {
  const r = (cor >> 16) & 0xff;
  const g = (cor >> 8) & 0xff;
  const b = cor & 0xff;
  const mix = (c: number): number => Math.round(c + (255 - c) * fator);
  return (mix(r) << 16) | (mix(g) << 8) | mix(b);
}
