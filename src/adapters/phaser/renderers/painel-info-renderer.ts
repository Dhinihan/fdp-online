import type { Scene } from 'phaser';
import type { Carta, Valor } from '@/core/Carta';
import type { Jogador } from '@/types/entidades';
import type { EstadoRodada, EstadoEmJogo } from '@/types/estado-rodada';
import { estadoEmJogo } from '@/types/estado-rodada';
import { escalar, escalarFonte } from '../escala';
import type { LayoutPainel, Retangulo } from '../layout';
import { limparObjetos } from './limpar-objetos';
import { desenharManilhaNoPainel } from './painel-manilha-renderer';

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
  desenharCabecalhoRodada(base, config.numeroRodada);
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

function calcularLayoutTabela(
  cena: Scene,
  area: Retangulo,
  ehPaisagem: boolean,
): { colunas: Colunas; areaManilha: Retangulo } {
  const tabelaX = area.x + escalar(10, cena);
  const larguraTabela = ehPaisagem ? area.largura - escalar(20, cena) : Math.round(area.largura * 0.6);
  const colunas: Colunas = {
    nome: tabelaX,
    declarado: tabelaX + Math.round(larguraTabela * 0.42),
    feito: tabelaX + Math.round(larguraTabela * 0.58),
    pontos: tabelaX + Math.round(larguraTabela * 0.74),
  };
  const areaManilha = ehPaisagem
    ? area
    : {
        x: area.x + Math.round(area.largura * 0.65),
        y: area.y,
        largura: Math.round(area.largura * 0.35),
        altura: area.altura,
      };
  return { colunas, areaManilha };
}

function desenharTabela(config: ConfigDesenho, painelConfig: ConfigPainelInfo, colunas: Colunas): void {
  if (painelConfig.estado.fase === 'distribuindo') return;
  const { cena, objetos, area } = config;
  const emJogo = estadoEmJogo(painelConfig.estado);
  const cabecalhoY = area.y + escalar(44, cena);
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
  const linhaY = cabecalhoY + escalar(20, cena);
  const espacamento = escalar(18, cena);
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
