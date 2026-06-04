import type { Scene } from 'phaser';
import type { Carta, Valor } from '@/core/Carta';
import type { Jogador } from '@/types/entidades';
import type { EstadoRodada, EstadoEmJogo } from '@/types/estado-rodada';
import { estadoEmJogo } from '@/types/estado-rodada';
import { escalar, escalarFonte } from '../escala';
import type { LayoutPainel, MinimosPainel, Retangulo } from '../layout';
import { calcularAreaManilha } from '../layout-manilha';
import { limparObjetos } from './limpar-objetos';
import { desenharManilhaNoPainel } from './painel-manilha-renderer';

// Geometria do painel, em unidades lógicas (escaladas por `escalar`).
// Compartilhada entre o desenho e o cálculo dos tamanhos mínimos: o desenho
// dos ícones, suas zonas de toque e a largura mínima do painel saem todos
// das constantes abaixo, para não divergirem.
const MARGEM_CABECALHO = 16; // padding horizontal do conteúdo do cabeçalho
const CABECALHO_Y = 22; // y do centro da linha do cabeçalho
const TAMANHO_ALVO = 36; // lado da zona de toque dos ícones 🏆 e ?
const GAP_ICONES = 4; // folga entre o rótulo e os ícones, e entre os dois ícones
const LARGURA_ROTULO_RODADA = 70;
const OFFSET_CABECALHO_TABELA = 44;
const OFFSET_PRIMEIRA_LINHA = 20;
const ESPACAMENTO_LINHA = 18;
const FOLGA_TABELA = 14;
const MARGEM_TABELA = 10;
// Em retrato a tabela ocupa 60% à esquerda; os 40% restantes ficam para a manilha.
const FRACAO_TABELA_RETRATO = 0.6;

export interface ConfigPainelInfo {
  cena: Scene;
  jogadores: Jogador[];
  estado: EstadoRodada;
  numeroRodada: number;
  manilha: Valor;
  cartaVirada: Carta | null;
  layout: LayoutPainel;
  objetos: Phaser.GameObjects.GameObject[];
  aoAbrirRanking?: () => void;
  aoAbrirTutorial?: () => void;
}

interface ConfigDesenho {
  cena: Scene;
  objetos: Phaser.GameObjects.GameObject[];
  area: Retangulo;
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
  const ehPaisagem = orientacao === 'paisagem';
  const base: ConfigDesenho = { cena, objetos, area: infoArea };

  desenharFundo(base);
  // Cabeçalho: "Rodada N" à esquerda, depois 🏆 e ? ancorados à direita
  // (? mais à direita), na borda da tabela — em retrato, antes da manilha.
  desenharCabecalhoRodada(base, config.numeroRodada);
  const { trofeuX, ajudaX } = posicoesIcones(infoArea, ehPaisagem, cena);
  if (config.aoAbrirRanking) desenharBotaoTrofeu(base, trofeuX, config.aoAbrirRanking);
  if (config.aoAbrirTutorial) desenharBotaoAjuda(base, ajudaX, config.aoAbrirTutorial);
  const { colunas, areaManilha } = calcularLayoutTabela(cena, infoArea, ehPaisagem);
  desenharTabela(base, config, colunas);
  if (config.cartaVirada) {
    desenharManilhaNoPainel({
      cena,
      objetos,
      cartaVirada: config.cartaVirada,
      manilha: config.manilha,
      areaManilha,
      ehPaisagem,
    });
  }
}

/**
 * Tamanhos mínimos do painel para o conteúdo não se sobrepor:
 * em paisagem, largura que comporte 🏆 + ? + "Rodada N" lado a lado;
 * em retrato, altura que comporte a tabela inteira de jogadores.
 */
export function calcularMinimosPainel(cena: Scene, qtdJogadores: number): MinimosPainel {
  // "Rodada N" (esquerda) + os dois ícones e suas zonas de toque (direita),
  // com folgas; usa o hitbox inteiro (não só o glifo) para nada se sobrepor.
  const larguraCabecalho =
    MARGEM_CABECALHO + LARGURA_ROTULO_RODADA + GAP_ICONES + TAMANHO_ALVO + GAP_ICONES + TAMANHO_ALVO + MARGEM_TABELA;
  const linhas = Math.max(qtdJogadores - 1, 0);
  const alturaTabela = OFFSET_CABECALHO_TABELA + OFFSET_PRIMEIRA_LINHA + linhas * ESPACAMENTO_LINHA + FOLGA_TABELA;
  return { largura: escalar(larguraCabecalho, cena), altura: escalar(alturaTabela, cena) };
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

// Borda direita do conteúdo do cabeçalho: em paisagem é a borda do painel;
// em retrato é a borda da tabela (60%), para os ícones não baterem na manilha.
function bordaDireitaTabela(area: Retangulo, ehPaisagem: boolean, cena: Scene): number {
  if (ehPaisagem) return area.x + area.largura - escalar(MARGEM_TABELA, cena);
  return area.x + escalar(MARGEM_TABELA, cena) + Math.round(area.largura * FRACAO_TABELA_RETRATO);
}

// x (borda esquerda) de cada ícone, ancorando o par à direita: ? é o mais à
// direita e o 🏆 fica à esquerda dele, separados por GAP_ICONES.
function posicoesIcones(area: Retangulo, ehPaisagem: boolean, cena: Scene): { trofeuX: number; ajudaX: number } {
  const alvo = escalar(TAMANHO_ALVO, cena);
  const ajudaX = bordaDireitaTabela(area, ehPaisagem, cena) - alvo;
  const trofeuX = ajudaX - escalar(GAP_ICONES, cena) - alvo;
  return { trofeuX, ajudaX };
}

function desenharCabecalhoRodada(config: ConfigDesenho, numero: number): void {
  if (!numero) return;
  const { cena, objetos, area } = config;
  const texto = cena.add
    .text(area.x + escalar(MARGEM_CABECALHO, cena), area.y + escalar(CABECALHO_Y, cena), `Rodada ${String(numero)}`, {
      fontSize: escalarFonte(13, cena),
      color: '#facc15',
      fontStyle: 'bold',
      fontFamily: 'Arial',
    })
    .setOrigin(0, 0.5)
    .setDepth(81);
  objetos.push(texto);
}

function desenharBotaoTrofeu(config: ConfigDesenho, x: number, aoAbrir: () => void): void {
  const { cena, objetos, area } = config;
  const y = area.y + escalar(CABECALHO_Y, cena);
  const trofeu = cena.add
    .text(x, y, '🏆', { fontSize: escalarFonte(18, cena), fontFamily: 'Arial' })
    .setOrigin(0, 0.5)
    .setDepth(82);
  const alvo = escalar(TAMANHO_ALVO, cena);
  const zona = cena.add.zone(x, y, alvo, alvo).setOrigin(0, 0.5).setDepth(82).setInteractive({ useHandCursor: true });
  zona.on('pointerdown', aoAbrir);
  objetos.push(trofeu, zona);
}

function desenharBotaoAjuda(config: ConfigDesenho, x: number, aoAbrir: () => void): void {
  const { cena, objetos, area } = config;
  const y = area.y + escalar(CABECALHO_Y, cena);
  const ajuda = cena.add
    .text(x, y, '?', { fontSize: escalarFonte(18, cena), color: '#7c9cff', fontStyle: 'bold', fontFamily: 'Arial' })
    .setOrigin(0, 0.5)
    .setDepth(82);
  const alvo = escalar(TAMANHO_ALVO, cena);
  const zona = cena.add.zone(x, y, alvo, alvo).setOrigin(0, 0.5).setDepth(82).setInteractive({ useHandCursor: true });
  zona.on('pointerdown', aoAbrir);
  objetos.push(ajuda, zona);
}

function calcularLayoutTabela(
  cena: Scene,
  area: Retangulo,
  ehPaisagem: boolean,
): { colunas: Colunas; areaManilha: Retangulo } {
  const tabelaX = area.x + escalar(MARGEM_TABELA, cena);
  const larguraTabela = ehPaisagem
    ? area.largura - escalar(MARGEM_TABELA * 2, cena)
    : Math.round(area.largura * FRACAO_TABELA_RETRATO);
  const colunas: Colunas = {
    nome: tabelaX,
    declarado: tabelaX + Math.round(larguraTabela * 0.42),
    feito: tabelaX + Math.round(larguraTabela * 0.58),
    pontos: tabelaX + Math.round(larguraTabela * 0.74),
  };
  const areaManilha = calcularAreaManilha(area, ehPaisagem);
  return { colunas, areaManilha };
}

function desenharTabela(config: ConfigDesenho, painelConfig: ConfigPainelInfo, colunas: Colunas): void {
  if (painelConfig.estado.fase === 'distribuindo') return;
  const { cena, objetos, area } = config;
  const emJogo = estadoEmJogo(painelConfig.estado);
  const cabecalhoY = area.y + escalar(OFFSET_CABECALHO_TABELA, cena);
  desenharCabecalhoTabela({ cena, objetos, colunas, y: cabecalhoY });
  desenharLinhasJogadores({ cena, objetos, colunas, cabecalhoY, jogadores: painelConfig.jogadores, emJogo });
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

interface ConfigLinhas {
  cena: Scene;
  objetos: Phaser.GameObjects.GameObject[];
  colunas: Colunas;
  cabecalhoY: number;
  jogadores: Jogador[];
  emJogo: EstadoEmJogo;
}

function desenharLinhasJogadores(config: ConfigLinhas): void {
  const { cena, objetos, colunas, cabecalhoY, jogadores, emJogo } = config;
  const linhaY = cabecalhoY + escalar(OFFSET_PRIMEIRA_LINHA, cena);
  const espacamento = escalar(ESPACAMENTO_LINHA, cena);
  jogadores.forEach((jogador, indice) => {
    const y = linhaY + indice * espacamento;
    const declarado = jogador.id in emJogo.declaracoes ? emJogo.declaracoes[jogador.id] : null;
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
