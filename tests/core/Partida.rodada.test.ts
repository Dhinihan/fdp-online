import { describe, it, expect, vi } from 'vitest';
import type { Carta } from '@/core/Carta';
import { createEmissorEventos } from '@/store/emissor-eventos';
import { criarCarta, criarDecisorPrimeiraCarta, criarPartidaComMao, jogadoresPadrao } from './partida-fixtures';

const MAO_CURTA: Carta[][] = [
  [criarCarta('A', '♣')],
  [criarCarta('K', '♥')],
  [criarCarta('Q', '♠')],
  [criarCarta('J', '♦')],
];

const MAO_LONGA: Carta[][] = [
  [criarCarta('A', '♣'), criarCarta('4', '♣'), criarCarta('4', '♣'), criarCarta('4', '♣')],
  [criarCarta('K', '♥'), criarCarta('A', '♥'), criarCarta('4', '♥'), criarCarta('4', '♥')],
  [criarCarta('Q', '♠'), criarCarta('K', '♠'), criarCarta('A', '♠'), criarCarta('4', '♠')],
  [criarCarta('J', '♦'), criarCarta('Q', '♦'), criarCarta('K', '♦'), criarCarta('A', '♦')],
];

async function jogarTurnos(partida: ReturnType<typeof criarPartidaComMao>, quantidade: number): Promise<void> {
  for (let i = 0; i < quantidade; i++) {
    await partida.jogarTurno();
  }
}

function partidaComMaoFixa(maos: Carta[][], cartasPorRodada = 1) {
  const emissor = createEmissorEventos();
  const jogadores = jogadoresPadrao();
  const decisores = new Map(jogadores.map((j) => [j.id, criarDecisorPrimeiraCarta()]));
  const partida = criarPartidaComMao({ jogadores, decisores, emissor, maos, cartasPorRodada });
  return { emissor, partida };
}

describe('Partida — cálculo de vencedor', () => {
  it('deve definir maior valor como vencedor do turno', async () => {
    const { partida } = partidaComMaoFixa(MAO_CURTA);
    await jogarTurnos(partida, 4);
    expect(partida.estado.vazas['j1']).toBe(1);
  });

  it('deve desempatar pelo naipe quando valores são iguais', async () => {
    const { partida } = partidaComMaoFixa([
      [criarCarta('4', '♦')],
      [criarCarta('4', '♠')],
      [criarCarta('4', '♥')],
      [criarCarta('4', '♣')],
    ]);
    await jogarTurnos(partida, 4);
    expect(partida.estado.vazas['j4']).toBe(1);
  });
});

describe('Partida — vazas e rodada', () => {
  it('deve acumular 4 vazas após 4 turnos', async () => {
    const { partida } = partidaComMaoFixa(MAO_LONGA, 4);
    await jogarTurnos(partida, 16);
    const totalVazas = Object.values(partida.estado.vazas).reduce((a, b) => a + b, 0);
    expect(totalVazas).toBe(4);
  });

  it('deve transitar para rodadaConcluida após o último turno', async () => {
    const { partida } = partidaComMaoFixa(MAO_LONGA, 4);
    await jogarTurnos(partida, 16);
    expect(partida.estado.fase).toBe('rodadaConcluida');
  });
});

describe('Partida — eventos de turno e rodada', () => {
  it('deve emitir TURNO_GANHO ao resolver um turno', async () => {
    const { emissor, partida } = partidaComMaoFixa(MAO_CURTA);
    const handler = vi.fn<(ev: unknown) => void>();
    emissor.on('TURNO_GANHO', handler);
    await jogarTurnos(partida, 4);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'TURNO_GANHO', jogadorId: 'j1' }));
  });

  it('deve emitir RODADA_ENCERRADA ao fim da rodada', async () => {
    const { emissor, partida } = partidaComMaoFixa(MAO_LONGA, 4);
    const handler = vi.fn<(ev: unknown) => void>();
    emissor.on('RODADA_ENCERRADA', handler);
    await jogarTurnos(partida, 16);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'RODADA_ENCERRADA' }));
  });
});
