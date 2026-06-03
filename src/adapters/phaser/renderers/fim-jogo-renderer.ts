import type { Scene } from 'phaser';
import { ROTULO_NIVEL } from '@/store/trofeus/tabela-trofeus';
import type { ResultadoTrofeus } from '@/store/trofeus/tipos';
import type { Jogador } from '@/types/entidades';
import { escalar, escalarFonte } from '../escala';
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
  primeiraLinhaY: number;
}

/** Espaçamento vertical (lógico) entre linhas empilhadas do cabeçalho da vitória. */
const ALTURA_LINHA_CABECALHO = 30;
/** Passo vertical (lógico) entre linhas da Classificação; também a altura da linha do vencedor. */
const ALTURA_LINHA_RANKING = 54;

export function desenharFimJogo(config: ConfigFimJogo): void {
  limparObjetos(config.objetos);
  desenharFundo(config);
  const { cena, objetos } = config;
  desenharTitulo(cena, objetos);
  // O cabeçalho da vitória é empilhado em offsets escalados a partir do título,
  // e a Classificação parte de onde o cabeçalho termina — assim os textos nunca
  // colidem com o pódio, qualquer que seja a proporção da tela.
  let cursorY = cena.cameras.main.height * 0.18 + escalar(54, cena);
  cursorY = desenharSequencia(config, cursorY);
  cursorY = desenharTrofeuDesbloqueado(config, cursorY);
  const primeiraLinhaY = cursorY + escalar(18, cena);
  config.classificacao.forEach((jogador, indice) => {
    desenharLinha({ cena, objetos, jogador, indice, primeiraLinhaY });
  });
  const ultimaLinhaY = primeiraLinhaY + (config.classificacao.length - 1) * escalar(ALTURA_LINHA_RANKING, cena);
  desenharBotao(config, ultimaLinhaY + escalar(58, cena));
}

/**
 * Exibe a Sequência de Vitórias quando há resultado a mostrar. A boundary de
 * troféus já decide isso: o resultado só existe na vitória, e é `null` na
 * derrota ou em falha de Storage — aqui não reinspecionamos a Classificação.
 * Devolve o `cursorY` avançado (ou inalterado quando nada é desenhado).
 */
function desenharSequencia(config: ConfigFimJogo, cursorY: number): number {
  if (config.resultadoTrofeus === null) return cursorY;
  const { cena, objetos } = config;
  const sequencia = cena.add
    .text(
      cena.cameras.main.centerX,
      cursorY,
      `Sequência de Vitórias: ${String(config.resultadoTrofeus.sequenciaAtual)}`,
      {
        fontSize: escalarFonte(18, cena),
        fontStyle: 'bold',
        color: '#facc15',
        fontFamily: 'Arial',
      },
    )
    .setOrigin(0.5)
    .setDepth(102);
  objetos.push(sequencia);
  return cursorY + escalar(ALTURA_LINHA_CABECALHO, cena);
}

/**
 * Destaque de celebração quando a vitória desbloqueia um Troféu novo. Nesta
 * slice o Troféu é só o rótulo textual do nível — a arte visual fica para a
 * slice de visual. Empilha logo abaixo da Sequência de Vitórias e devolve o
 * `cursorY` avançado (ou inalterado quando não há desbloqueio).
 */
function desenharTrofeuDesbloqueado(config: ConfigFimJogo, cursorY: number): number {
  const nivel = config.resultadoTrofeus?.trofeuDesbloqueado;
  if (!nivel) return cursorY;
  const { cena, objetos } = config;
  const destaque = cena.add
    .text(cena.cameras.main.centerX, cursorY, `Troféu desbloqueado: ${ROTULO_NIVEL[nivel]}`, {
      fontSize: escalarFonte(20, cena),
      fontStyle: 'bold',
      color: '#fde68a',
      fontFamily: 'Arial',
    })
    .setOrigin(0.5)
    .setDepth(102);
  objetos.push(destaque);
  return cursorY + escalar(ALTURA_LINHA_CABECALHO, cena);
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

function desenharTitulo(cena: Scene, objetos: Phaser.GameObjects.GameObject[]): void {
  const y = cena.cameras.main.height * 0.18;
  const titulo = cena.add
    .text(cena.cameras.main.centerX, y, 'Fim de jogo', {
      fontSize: escalarFonte(34, cena),
      fontStyle: 'bold',
      color: '#ffffff',
      fontFamily: 'Arial',
    })
    .setOrigin(0.5)
    .setDepth(102);
  objetos.push(titulo);
}

function desenharLinha(config: LinhaRanking & { cena: Scene; objetos: Phaser.GameObjects.GameObject[] }): void {
  const { cena, objetos, jogador, indice } = config;
  const largura = Math.min(escalar(360, cena), cena.cameras.main.width - escalar(32, cena));
  const altura = escalar(indice === 0 ? ALTURA_LINHA_RANKING : 44, cena);
  const x = cena.cameras.main.centerX;
  const y = config.primeiraLinhaY + indice * escalar(ALTURA_LINHA_RANKING, cena);
  const cor = indice === 0 ? 0x4ecca3 : 0x16213e;
  const fundo = cena.add.rectangle(x, y, largura, altura, cor, indice === 0 ? 0.95 : 0.82);
  fundo.setStrokeStyle(escalar(1, cena), indice === 0 ? 0xfacc15 : 0xffffff, indice === 0 ? 0.8 : 0.18);
  fundo.setDepth(101);
  objetos.push(fundo);
  desenharTextoLinha(cena, objetos, { jogador, indice, x, y, largura });
  if (indice === 0) animarVencedor(cena, fundo);
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
      fontSize: escalarFonte(config.indice === 0 ? 19 : 16, cena),
      fontStyle: config.indice === 0 ? 'bold' : 'normal',
      color: config.indice === 0 ? '#0b1020' : '#ffffff',
      fontFamily: 'Arial',
    })
    .setOrigin(0, 0.5)
    .setDepth(102);
  const pontos = cena.add
    .text(config.x + config.largura / 2 - escalar(18, cena), config.y, `${String(config.jogador.pontos)} pts`, {
      fontSize: escalarFonte(16, cena),
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

function desenharBotao(config: ConfigFimJogo, y: number): void {
  const { cena, objetos } = config;
  const largura = escalar(220, cena);
  const altura = escalar(52, cena);
  const x = cena.cameras.main.centerX;
  const botao = cena.add.rectangle(x, y, largura, altura, 0xfacc15, 1).setDepth(102);
  const texto = cena.add
    .text(x, y, 'Jogar novamente', {
      fontSize: escalarFonte(18, cena),
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
