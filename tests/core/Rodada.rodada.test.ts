import { describe, it, expect, vi } from 'vitest';
import type { Carta } from '@/core/Carta';
import { createEmissorEventos } from '@/store/emissor-eventos';
import { criarCarta, criarDecisorPrimeiraCarta, criarRodadaComMao, jogadoresPadrao } from './rodada-fixtures';

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

async function jogarTurnos(rodada: ReturnType<typeof criarRodadaComMao>, quantidade: number): Promise<void> {
  for (let i = 0; i < quantidade; i++) {
    await rodada.jogarTurno();
  }
}

function rodadaComMaoFixa(maos: Carta[][], cartasPorRodada = 1) {
  const emissor = createEmissorEventos();
  const jogadores = jogadoresPadrao();
  const decisores = new Map(jogadores.map((j) => [j.id, criarDecisorPrimeiraCarta()]));
  const declaracoes = Object.fromEntries(jogadores.map((jogador) => [jogador.id, 0]));
  const rodada = criarRodadaComMao({ jogadores, decisores, emissor, maos, cartasPorRodada, declaracoes });
  return { emissor, rodada };
}

describe('Rodada — cálculo de vencedor', () => {
  it('deve definir maior valor como vencedor do turno', async () => {
    const { rodada } = rodadaComMaoFixa(MAO_CURTA);
    await jogarTurnos(rodada, 4);
    expect(rodada.estado.vazas['j1']).toBe(1);
  });

  it('deve desempatar pelo naipe quando valores são iguais (manilhas)', async () => {
    const emissor = createEmissorEventos();
    const jogadores = jogadoresPadrao();
    const decisores = new Map(jogadores.map((j) => [j.id, criarDecisorPrimeiraCarta()]));
    const rodada = criarRodadaComMao({
      jogadores,
      decisores,
      emissor,
      maos: [[criarCarta('4', '♦')], [criarCarta('4', '♠')], [criarCarta('4', '♥')], [criarCarta('4', '♣')]],
      manilha: '4',
    });
    await jogarTurnos(rodada, 4);
    expect(rodada.estado.vazas['j4']).toBe(1);
  });
});

describe('Rodada — vazas e rodada', () => {
  it('deve iniciar todos os jogadores com 5 pontos', () => {
    const { rodada } = rodadaComMaoFixa(MAO_CURTA);
    expect(rodada.estado.pontos).toEqual({ j1: 5, j2: 5, j3: 5, j4: 5 });
  });

  it('deve acumular 4 vazas após 4 turnos', async () => {
    const { rodada } = rodadaComMaoFixa(MAO_LONGA, 4);
    await jogarTurnos(rodada, 16);
    expect(rodada.estado.vazas).toEqual({ j1: 1, j2: 1, j3: 1, j4: 1 });
  });

  it('deve transitar para rodadaConcluida após o último turno', async () => {
    const { rodada } = rodadaComMaoFixa(MAO_LONGA, 4);
    await jogarTurnos(rodada, 16);
    expect(rodada.estado.fase).toBe('rodadaConcluida');
  });
});

describe('Rodada — pontuação', () => {
  it('deve subtrair penalidades dos pontos ao fim da rodada', async () => {
    const emissor = createEmissorEventos();
    const jogadores = jogadoresPadrao();
    const decisores = new Map(jogadores.map((j) => [j.id, criarDecisorPrimeiraCarta()]));
    const rodada = criarRodadaComMao({
      jogadores,
      decisores,
      emissor,
      maos: MAO_CURTA,
      cartasPorRodada: 1,
      declaracoes: { j1: 1, j2: 1, j3: 0, j4: 0 },
    });
    await jogarTurnos(rodada, 4);
    expect(rodada.estado.pontos).toEqual({ j1: 5, j2: 4, j3: 5, j4: 5 });
  });
});

describe('Rodada — eventos de turno e rodada', () => {
  it('deve emitir TURNO_GANHO ao resolver um turno', async () => {
    const { emissor, rodada } = rodadaComMaoFixa(MAO_CURTA);
    const handler = vi.fn<(ev: unknown) => void>();
    emissor.on('TURNO_GANHO', handler);
    await jogarTurnos(rodada, 4);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'TURNO_GANHO', jogadorId: 'j1' }));
  });

  it('deve emitir RODADA_ENCERRADA ao fim da rodada', async () => {
    const { emissor, rodada } = rodadaComMaoFixa(MAO_LONGA, 4);
    const handler = vi.fn<(ev: unknown) => void>();
    emissor.on('RODADA_ENCERRADA', handler);
    await jogarTurnos(rodada, 16);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: 'RODADA_ENCERRADA',
        placar: { j1: 1, j2: 1, j3: 1, j4: 1 },
      }),
    );
  });
});

describe('Rodada — eventos de pontuação', () => {
  it('deve emitir PONTUACAO_APLICADA com placar e penalidades', async () => {
    const { emissor, rodada } = rodadaComMaoFixa(MAO_CURTA);
    const handler = vi.fn<(ev: unknown) => void>();
    emissor.on('PONTUACAO_APLICADA', handler);
    await jogarTurnos(rodada, 4);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: 'PONTUACAO_APLICADA',
        placar: { j1: 4, j2: 5, j3: 5, j4: 5 },
        penalidades: { j1: 1, j2: 0, j3: 0, j4: 0 },
      }),
    );
  });
});
