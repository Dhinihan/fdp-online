import type { Scene } from 'phaser';
import type { ResultadoTrofeus } from '@/store/trofeus/tipos';
import type { Jogador } from '@/types/entidades';
import { desenharTrofeuArte } from '../desenhar-trofeu-arte';
import { escalar } from '../escala';
import { limparObjetos } from './limpar-objetos';

interface ConfigFimJogo {
  cena: Scene;
  classificacao: Jogador[];
  resultadoTrofeus: ResultadoTrofeus | null;
  objetos: Phaser.GameObjects.GameObject[];
  onReiniciar: () => void;
  /** Anima fundo (fade-in) só na primeira exibição; no re-render por resize fica estático. */
  animar: boolean;
}

interface LinhaRanking {
  jogador: Jogador;
  indice: number;
  layout: LayoutFimJogo;
}

interface LayoutFimJogo {
  tituloY: number;
  sequenciaY: number | null;
  trofeuY: number | null;
  primeiraLinhaY: number;
  passoRanking: number;
  alturaLinhaVencedor: number;
  alturaLinha: number;
  botaoY: number;
  larguraRanking: number;
  larguraBotao: number;
  alturaBotao: number;
  escalaConteudo: number;
}

interface MetricasFimJogo {
  linhasCabecalho: number;
  totalNatural: number;
  escalaConteudo: number;
}

const MARGEM_VERTICAL = 24;
const ALTURA_TITULO = 42;
const ESPACO_TITULO_CABECALHO = 24;
const ALTURA_LINHA_CABECALHO = 30;
const ESPACO_CABECALHO_RANKING = 18;
const PASSO_RANKING = 54;
const ALTURA_LINHA_VENCEDOR = 54;
const ALTURA_LINHA = 44;
const ESPACO_RANKING_BOTAO = 30;
const ALTURA_BOTAO = 52;
const LARGURA_RANKING = 360;
const LARGURA_BOTAO = 220;

export function desenharFimJogo(config: ConfigFimJogo): void {
  limparFimJogoAnterior(config);
  desenharFundo(config);
  const { cena, objetos } = config;
  const layout = calcularLayoutFimJogo(config);
  desenharTitulo(cena, objetos, layout);
  desenharSequencia(config, layout);
  desenharTrofeuDesbloqueado(config, layout);
  config.classificacao.forEach((jogador, indice) => {
    desenharLinha({ cena, objetos, jogador, indice, layout }, config.animar);
  });
  desenharBotao(config, layout);
}

function limparFimJogoAnterior(config: ConfigFimJogo): void {
  config.cena.tweens.killTweensOf(config.objetos);
  limparObjetos(config.objetos);
}

function calcularLayoutFimJogo(config: ConfigFimJogo): LayoutFimJogo {
  const { cena } = config;
  const metricas = calcularMetricas(config);
  const paraTela = (valor: number): number => Math.round(escalar(valor, cena) * metricas.escalaConteudo);
  const posicoes = calcularPosicoes(config, metricas, paraTela);
  return {
    ...posicoes,
    passoRanking: paraTela(PASSO_RANKING),
    alturaLinhaVencedor: paraTela(ALTURA_LINHA_VENCEDOR),
    alturaLinha: paraTela(ALTURA_LINHA),
    larguraRanking: Math.min(escalar(LARGURA_RANKING, cena), cena.cameras.main.width - escalar(32, cena)),
    larguraBotao: escalar(LARGURA_BOTAO, cena),
    alturaBotao: paraTela(ALTURA_BOTAO),
    escalaConteudo: metricas.escalaConteudo,
  };
}

function calcularMetricas(config: ConfigFimJogo): MetricasFimJogo {
  const linhasCabecalho = contarLinhasCabecalho(config.resultadoTrofeus);
  const totalNatural =
    MARGEM_VERTICAL * 2 +
    ALTURA_TITULO +
    espacoCabecalho(linhasCabecalho) +
    Math.max(0, config.classificacao.length - 1) * PASSO_RANKING +
    ALTURA_LINHA_VENCEDOR +
    ESPACO_RANKING_BOTAO +
    ALTURA_BOTAO;
  return {
    linhasCabecalho,
    totalNatural,
    escalaConteudo: Math.min(1, Math.max(0.62, config.cena.cameras.main.height / escalar(totalNatural, config.cena))),
  };
}

function calcularPosicoes(
  config: ConfigFimJogo,
  metricas: MetricasFimJogo,
  paraTela: (valor: number) => number,
): Pick<LayoutFimJogo, 'tituloY' | 'sequenciaY' | 'trofeuY' | 'primeiraLinhaY' | 'botaoY'> {
  let cursor = Math.max(escalar(12, config.cena), inicioVertical(config, metricas, paraTela));
  const tituloY = cursor + paraTela(ALTURA_TITULO) / 2;
  cursor += paraTela(ALTURA_TITULO + espacoAposTitulo(metricas.linhasCabecalho));
  const sequenciaY = config.resultadoTrofeus === null ? null : cursor + paraTela(ALTURA_LINHA_CABECALHO) / 2;
  cursor += sequenciaY === null ? 0 : paraTela(ALTURA_LINHA_CABECALHO);
  const trofeuY = config.resultadoTrofeus?.trofeuDesbloqueado ? cursor + paraTela(ALTURA_LINHA_CABECALHO) / 2 : null;
  cursor += trofeuY === null ? 0 : paraTela(ALTURA_LINHA_CABECALHO);
  cursor += metricas.linhasCabecalho > 0 ? paraTela(ESPACO_CABECALHO_RANKING) : 0;
  const primeiraLinhaY = cursor + paraTela(ALTURA_LINHA_VENCEDOR) / 2;
  const ultimaLinhaY = primeiraLinhaY + Math.max(0, config.classificacao.length - 1) * paraTela(PASSO_RANKING);
  const botaoY = ultimaLinhaY + paraTela(ALTURA_LINHA_VENCEDOR / 2 + ESPACO_RANKING_BOTAO + ALTURA_BOTAO / 2);
  return { tituloY, sequenciaY, trofeuY, primeiraLinhaY, botaoY };
}

function contarLinhasCabecalho(resultado: ResultadoTrofeus | null): number {
  return (resultado === null ? 0 : 1) + (resultado?.trofeuDesbloqueado ? 1 : 0);
}

function espacoCabecalho(linhasCabecalho: number): number {
  if (linhasCabecalho === 0) return ESPACO_CABECALHO_RANKING;
  return ESPACO_TITULO_CABECALHO + linhasCabecalho * ALTURA_LINHA_CABECALHO + ESPACO_CABECALHO_RANKING;
}

function espacoAposTitulo(linhasCabecalho: number): number {
  return linhasCabecalho > 0 ? ESPACO_TITULO_CABECALHO : ESPACO_CABECALHO_RANKING;
}

function inicioVertical(config: ConfigFimJogo, metricas: MetricasFimJogo, paraTela: (valor: number) => number): number {
  return (config.cena.cameras.main.height - paraTela(metricas.totalNatural - MARGEM_VERTICAL * 2)) / 2;
}

/**
 * Exibe a Sequência de Vitórias quando há resultado a mostrar. A boundary de
 * troféus já decide isso: o resultado só existe na vitória, e é `null` na
 * derrota ou em falha de Storage — aqui não reinspecionamos a Classificação.
 */
function desenharSequencia(config: ConfigFimJogo, layout: LayoutFimJogo): void {
  if (config.resultadoTrofeus === null || layout.sequenciaY === null) return;
  const { cena, objetos } = config;
  const sequencia = cena.add
    .text(
      cena.cameras.main.centerX,
      layout.sequenciaY,
      `Sequência de Vitórias: ${String(config.resultadoTrofeus.sequenciaAtual)}`,
      {
        fontSize: fonteFimJogo(18, cena, layout),
        fontStyle: 'bold',
        color: '#facc15',
        fontFamily: 'Arial',
      },
    )
    .setOrigin(0.5)
    .setDepth(102);
  objetos.push(sequencia);
}

/**
 * Destaque de celebração quando a vitória desbloqueia um Troféu novo: o texto
 * seguido da arte do Troféu conquistado, centrados como um grupo na linha.
 */
function desenharTrofeuDesbloqueado(config: ConfigFimJogo, layout: LayoutFimJogo): void {
  const nivel = config.resultadoTrofeus?.trofeuDesbloqueado;
  if (!nivel || layout.trofeuY === null) return;
  const { cena, objetos } = config;
  const tamanho = Math.round(escalar(26, cena) * layout.escalaConteudo);
  const gap = escalar(8, cena);
  const texto = cena.add
    .text(0, layout.trofeuY, 'Troféu desbloqueado:', {
      fontSize: fonteFimJogo(20, cena, layout),
      fontStyle: 'bold',
      color: '#fde68a',
      fontFamily: 'Arial',
    })
    .setOrigin(0, 0.5)
    .setDepth(102);
  const larguraTotal = texto.width + gap + tamanho;
  const inicioX = cena.cameras.main.centerX - larguraTotal / 2;
  texto.setX(inicioX);
  const trofeu = desenharTrofeuArte(cena, {
    x: inicioX + texto.width + gap + tamanho / 2,
    y: layout.trofeuY,
    tamanho,
    nivel,
  }).setDepth(102);
  objetos.push(texto, trofeu);
}

function desenharFundo(config: ConfigFimJogo): void {
  const { cena, objetos } = config;
  const fundo = cena.add.rectangle(0, 0, cena.cameras.main.width, cena.cameras.main.height, 0x050816, 0.94);
  fundo.setOrigin(0).setDepth(100);
  if (!config.animar) {
    objetos.push(fundo);
    return;
  }
  fundo.setAlpha(0);
  cena.tweens.add({ targets: fundo, alpha: 1, duration: 350, ease: 'Sine.easeOut' });
  objetos.push(fundo);
}

function desenharTitulo(cena: Scene, objetos: Phaser.GameObjects.GameObject[], layout: LayoutFimJogo): void {
  const titulo = cena.add
    .text(cena.cameras.main.centerX, layout.tituloY, 'Fim de jogo', {
      fontSize: fonteFimJogo(34, cena, layout),
      fontStyle: 'bold',
      color: '#ffffff',
      fontFamily: 'Arial',
    })
    .setOrigin(0.5)
    .setDepth(102);
  objetos.push(titulo);
}

function desenharLinha(
  config: LinhaRanking & { cena: Scene; objetos: Phaser.GameObjects.GameObject[] },
  animar: boolean,
): void {
  const { cena, objetos, jogador, indice } = config;
  const { layout } = config;
  const largura = layout.larguraRanking;
  const altura = indice === 0 ? layout.alturaLinhaVencedor : layout.alturaLinha;
  const x = cena.cameras.main.centerX;
  const y = layout.primeiraLinhaY + indice * layout.passoRanking;
  const cor = indice === 0 ? 0x4ecca3 : 0x16213e;
  const fundo = cena.add.rectangle(x, y, largura, altura, cor, indice === 0 ? 0.95 : 0.82);
  fundo.setStrokeStyle(escalar(1, cena), indice === 0 ? 0xfacc15 : 0xffffff, indice === 0 ? 0.8 : 0.18);
  fundo.setDepth(101);
  objetos.push(fundo);
  desenharTextoLinha(cena, objetos, { jogador, indice, x, y, largura, layout });
  if (indice === 0 && animar) animarVencedor(cena, fundo);
}

function desenharTextoLinha(
  cena: Scene,
  objetos: Phaser.GameObjects.GameObject[],
  config: Omit<LinhaRanking, 'primeiraLinhaY'> & { x: number; y: number; largura: number },
): void {
  const medalha = config.indice === 0 ? '* ' : '';
  const texto = `${medalha}${String(config.indice + 1)}. ${config.jogador.nome}`;
  const nome = cena.add
    .text(config.x - config.largura / 2 + escalar(18, cena), config.y, texto, {
      fontSize: fonteFimJogo(config.indice === 0 ? 19 : 16, cena, config.layout),
      fontStyle: config.indice === 0 ? 'bold' : 'normal',
      color: config.indice === 0 ? '#0b1020' : '#ffffff',
      fontFamily: 'Arial',
    })
    .setOrigin(0, 0.5)
    .setDepth(102);
  const pontos = cena.add
    .text(config.x + config.largura / 2 - escalar(18, cena), config.y, `${String(config.jogador.pontos)} pts`, {
      fontSize: fonteFimJogo(16, cena, config.layout),
      fontStyle: 'bold',
      color: config.indice === 0 ? '#0b1020' : '#dbeafe',
      fontFamily: 'Arial',
    })
    .setOrigin(1, 0.5)
    .setDepth(102);
  objetos.push(nome, pontos);
}

function animarVencedor(cena: Scene, alvo: Phaser.GameObjects.Rectangle): void {
  cena.tweens.add({
    targets: alvo,
    scaleX: 1.03,
    scaleY: 1.03,
    duration: 700,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });
}

function desenharBotao(config: ConfigFimJogo, layout: LayoutFimJogo): void {
  const { cena, objetos } = config;
  const largura = layout.larguraBotao;
  const altura = layout.alturaBotao;
  const x = cena.cameras.main.centerX;
  const y = layout.botaoY;
  const botao = cena.add.rectangle(x, y, largura, altura, 0xfacc15, 1).setDepth(102);
  const texto = cena.add
    .text(x, y, 'Jogar novamente', {
      fontSize: fonteFimJogo(18, cena, layout),
      fontStyle: 'bold',
      color: '#111827',
      fontFamily: 'Arial',
    })
    .setOrigin(0.5)
    .setDepth(103);
  const zona = cena.add.zone(x, y, largura, altura).setInteractive({ useHandCursor: true }).setDepth(104);
  zona.on('pointerdown', config.onReiniciar);
  objetos.push(botao, texto, zona);
}

function fonteFimJogo(tamanho: number, cena: Scene, layout: LayoutFimJogo): string {
  return `${String(Math.max(11, Math.round(escalar(tamanho, cena) * layout.escalaConteudo)))}px`;
}
