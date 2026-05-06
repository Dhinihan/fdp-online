import type { Scene } from 'phaser';
import type { Carta } from '@/core/Carta';
import type { Rodada } from '@/core/Rodada';
import type { DecisorHumano } from '../DecisorHumano';
import { destacarCarta, removerDestaque, type EstadoDestaque } from '../renderers/destaque-renderer';

export interface ConfigInteracaoHumano {
  cena: Scene;
  objetosMao: Phaser.GameObjects.GameObject[];
  cartas: Carta[];
  rodada: Rodada;
  decisorHumano: DecisorHumano;
  destaque: EstadoDestaque;
}

export function configurarInteracaoHumano(config: ConfigInteracaoHumano): void {
  const { cena, objetosMao, cartas, rodada, decisorHumano, destaque } = config;
  objetosMao.forEach((objeto, j) => {
    const container = objeto as Phaser.GameObjects.Container;
    container.setInteractive();
    const carta = cartas.at(j);
    if (!carta) {
      return;
    }
    container.setData('carta', carta);
    container.on('pointerdown', () => {
      aoClicarCarta({ cena, container, carta, rodada, decisorHumano, destaque });
    });
  });
}

export interface ConfigFundo {
  cena: Scene;
  objetos: Phaser.GameObjects.GameObject[];
  decisorHumano: DecisorHumano;
  destaque: EstadoDestaque;
}

export function criarFundoInterativo(config: ConfigFundo): void {
  const { cena, objetos, decisorHumano, destaque } = config;
  const { width: largura, height: altura } = cena.cameras.main;
  const fundo = cena.add
    .rectangle(largura / 2, altura / 2, largura, altura, 0x000000, 0)
    .setInteractive()
    .setDepth(-100);
  objetos.push(fundo);
  fundo.on('pointerdown', () => {
    decisorHumano.desmarcar();
    removerDestaque(destaque);
  });
}

interface ConfigClicarCarta {
  cena: Scene;
  container: Phaser.GameObjects.Container;
  carta: Carta;
  rodada: Rodada;
  decisorHumano: DecisorHumano;
  destaque: EstadoDestaque;
}

function aoClicarCarta(config: ConfigClicarCarta): void {
  const { cena, container, carta, rodada, decisorHumano, destaque } = config;
  if (rodada.estado.fase !== 'aguardandoJogada') {
    return;
  }
  if (rodada.estado.maos[rodada.estado.jogadorAtual].jogador.id !== 'humano') {
    return;
  }
  if (destaque.container === container) {
    decisorHumano.confirmar();
    return;
  }
  decisorHumano.selecionar(carta);
  destacarCarta(cena, container, destaque);
}
