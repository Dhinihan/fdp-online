import type { Scene } from 'phaser';
import type { Carta, Valor } from '@/core/Carta';
import type { Jogador } from '@/types/entidades';
import type { EstadoRodada } from '@/types/estado-rodada';
import { estadoEmJogo } from '@/types/estado-rodada';
import { escalar, escalarFonte } from '../escala';
import type { LayoutPainel } from '../layout';
import { limparObjetos } from './limpar-objetos';
import { criarMiniCarta } from './mini-carta-renderer';

interface Area {
  x: number;
  y: number;
  largura: number;
  altura: number;
}

export interface ConfigPainelInfo {
  cena: Scene;
  jogadores: Jogador[];
  estado: EstadoRodada;
  numeroRodada: number;
  manilha: Valor;
  cartaVirada: Carta | null;
  layout: LayoutPainel;
  objetos: Phaser.GameObjects.GameObject[];
}

interface ConfigDesenho {
  cena: Scene;
  objetos: Phaser.GameObjects.GameObject[];
  area: Area;
}

interface Colunas {
  nome: number;
  declarado: number;
  feito: number;
  pontos: number;
}

export function desenharPainelInfo(config: ConfigPainelInfo): void {
  const { cena, layout, objetos } = config;
  limparObjetos(objetos);
  const { infoArea, orientacao } = layout;
  const base: ConfigDesenho = { cena, objetos, area: infoArea };

  desenharFundo(base);
  desenharCabecalhoRodada(base, config.numeroRodada);
  desenharTabela(base, config);
  desenharManilha(base, config, orientacao === 'paisagem');
}

function desenharFundo(config: ConfigDesenho): void {
  const { cena, objetos, area } = config;
  const fundo = cena.add.rectangle(
    area.x + area.largura / 2,
    area.y + area.altura / 2,
    area.largura,
    area.altura,
    0x111827,
    1,
  );
  fundo.setOrigin(0.5).setDepth(80);
  objetos.push(fundo);
}

function desenharCabecalhoRodada(config: ConfigDesenho, numero: number): void {
  if (!numero) return;
  const { cena, objetos, area } = config;
  const texto = cena.add
    .text(area.x + area.largura / 2, area.y + escalar(20, cena), `Rodada ${String(numero)}`, {
      fontSize: escalarFonte(13, cena),
      color: '#facc15',
      fontStyle: 'bold',
      fontFamily: 'Arial',
    })
    .setOrigin(0.5, 0)
    .setDepth(81);
  objetos.push(texto);
}

function desenharTabela(config: ConfigDesenho, painelConfig: ConfigPainelInfo): void {
  if (painelConfig.estado.fase === 'distribuindo') return;
  const { cena, objetos, area } = config;
  const emJogo = estadoEmJogo(painelConfig.estado);
  const colunas = calcularColunas(cena, area);
  const cabecalhoY = area.y + escalar(44, cena);
  desenharCabecalhoTabela({ cena, objetos, colunas, y: cabecalhoY });
  desenharLinhasJogadores({ cena, objetos, colunas, cabecalhoY, jogadores: painelConfig.jogadores, emJogo });
}

function calcularColunas(cena: Scene, area: Area): Colunas {
  const tabelaX = area.x + escalar(10, cena);
  const larguraUtil = area.largura - escalar(20, cena);
  return {
    nome: tabelaX,
    declarado: tabelaX + Math.round(larguraUtil * 0.42),
    feito: tabelaX + Math.round(larguraUtil * 0.58),
    pontos: tabelaX + Math.round(larguraUtil * 0.74),
  };
}

interface ConfigCabecalho {
  cena: Scene;
  objetos: Phaser.GameObjects.GameObject[];
  colunas: Colunas;
  y: number;
}

function desenharCabecalhoTabela(config: ConfigCabecalho): void {
  const { cena, objetos, colunas, y } = config;
  adicionarTexto(cena, objetos, { texto: 'Jogador', x: colunas.nome, y, cor: '#94a3b8' });
  adicionarTexto(cena, objetos, { texto: 'D', x: colunas.declarado, y, cor: '#94a3b8' });
  adicionarTexto(cena, objetos, { texto: 'F', x: colunas.feito, y, cor: '#94a3b8' });
  adicionarTexto(cena, objetos, { texto: 'Pts', x: colunas.pontos, y, cor: '#94a3b8' });
}

interface TextoArgs {
  texto: string;
  x: number;
  y: number;
  cor: string;
}

function adicionarTexto(cena: Scene, objetos: Phaser.GameObjects.GameObject[], args: TextoArgs): void {
  const obj = cena.add
    .text(args.x, args.y, args.texto, {
      fontSize: escalarFonte(10, cena),
      color: args.cor,
      fontFamily: 'Arial',
    })
    .setOrigin(0, 0.5)
    .setDepth(81);
  objetos.push(obj);
}

interface DadosEmJogo {
  declaracoes: Partial<Record<string, number>>;
  vazas: Record<string, number>;
  pontos: Record<string, number>;
}

interface ConfigLinhas {
  cena: Scene;
  objetos: Phaser.GameObjects.GameObject[];
  colunas: Colunas;
  cabecalhoY: number;
  jogadores: Jogador[];
  emJogo: DadosEmJogo;
}

function desenharLinhasJogadores(config: ConfigLinhas): void {
  const { cena, objetos, colunas, cabecalhoY, jogadores, emJogo } = config;
  const linhaY = cabecalhoY + escalar(20, cena);
  const espacamento = escalar(18, cena);
  jogadores.forEach((jogador, indice) => {
    const y = linhaY + indice * espacamento;
    const declarado = emJogo.declaracoes[jogador.id] ?? null;
    const feito = emJogo.vazas[jogador.id] ?? 0;
    const pontos = emJogo.pontos[jogador.id] ?? jogador.pontos;
    const corPontos = pontos < 0 ? '#ff6b6b' : '#ffffff';
    adicionarTexto(cena, objetos, { texto: jogador.nome, x: colunas.nome, y, cor: '#ffffff' });
    adicionarTexto(cena, objetos, {
      texto: declarado === null ? '-' : String(declarado),
      x: colunas.declarado,
      y,
      cor: '#ffffff',
    });
    adicionarTexto(cena, objetos, { texto: String(feito), x: colunas.feito, y, cor: '#ffffff' });
    adicionarTexto(cena, objetos, { texto: String(pontos), x: colunas.pontos, y, cor: corPontos });
  });
}

function desenharManilha(config: ConfigDesenho, painelConfig: ConfigPainelInfo, ehPaisagem: boolean): void {
  if (!painelConfig.cartaVirada) return;
  const { cena, objetos, area } = config;
  const posicao = calcularPosicaoManilha(cena, area, ehPaisagem);
  const miniCarta = criarMiniCarta({ cena, x: posicao.x, y: posicao.y, carta: painelConfig.cartaVirada });
  miniCarta.setDepth(81);
  objetos.push(miniCarta);
  const label = criarLabelManilha({ cena, manilha: painelConfig.manilha, posicao, ehPaisagem });
  objetos.push(label);
}

function calcularPosicaoManilha(cena: Scene, area: Area, ehPaisagem: boolean): { x: number; y: number } {
  if (ehPaisagem) {
    return { x: area.x + area.largura / 2, y: area.y + area.altura - escalar(70, cena) };
  }
  return { x: area.x + area.largura - escalar(40, cena), y: area.y + area.altura / 2 };
}

interface ConfigLabelManilha {
  cena: Scene;
  manilha: Valor;
  posicao: { x: number; y: number };
  ehPaisagem: boolean;
}

function criarLabelManilha(config: ConfigLabelManilha): Phaser.GameObjects.Text {
  const { cena, manilha, posicao, ehPaisagem } = config;
  const labelX = ehPaisagem ? posicao.x : posicao.x - escalar(38, cena);
  const labelY = ehPaisagem ? posicao.y + escalar(32, cena) : posicao.y;
  return cena.add
    .text(labelX, labelY, `Manilha: ${manilha}`, {
      fontSize: escalarFonte(9, cena),
      color: '#facc15',
      fontFamily: 'Arial',
    })
    .setOrigin(ehPaisagem ? 0.5 : 1, 0.5)
    .setDepth(81);
}
