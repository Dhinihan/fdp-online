import type { Rodada } from '@/core/Rodada';
import type { Jogador } from '@/types/entidades';
import type { DecisorDeclaracaoHumano } from '../DecisorDeclaracaoHumano';
import { iniciarProcessamentoTurno, processarDeclaracoes } from './jogo-scene-loop';
import type { JogoScene } from './JogoScene';

interface ConfigDeclaracaoCena {
  cena: JogoScene;
  rodada: Rodada;
  objetos: Phaser.GameObjects.GameObject[];
  decisorHumano: DecisorDeclaracaoHumano;
  atualizarIndicadorVez: () => void;
  atualizarPlacar: () => void;
  iniciarTurnos: () => Promise<void>;
}

interface ConfigTurnosCena {
  cena: JogoScene;
  rodada: Rodada;
  getLabels: () => Phaser.GameObjects.Text[];
  getDirecoesLabels: () => ('horizontal' | 'vertical')[];
  turnoAnteriorRef: { valor: number };
  jogadores: Jogador[];
  getVencedorTurno: () => string | undefined;
  animarRecolhimento: () => void;
  atualizarIndicadorVez: () => void;
}

export function iniciarDeclaracaoDaCena(config: ConfigDeclaracaoCena): void {
  void processarDeclaracoes(config).catch(() => undefined);
}

export async function iniciarTurnosDaCena(config: ConfigTurnosCena): Promise<void> {
  await iniciarProcessamentoTurno(config);
}
