import { describe, it, expect, vi } from 'vitest';
import type { Carta } from '@/core/Carta';
import type { DecisorJogada } from '@/core/portas/DecisorJogada';
import { Rodada } from '@/core/Rodada';
import { createEmissorEventos } from '@/store/emissor-eventos';
import { estadoEmJogo } from '@/types/estado-rodada';
import { criarCarta, criarJogador, criarDecisorPrimeiraCarta, criarRodadaComMao } from './rodada-fixtures';

function criarRodadaEmpate(maos: Carta[][], manilha: Carta['valor'] = '3') {
  const emissor = createEmissorEventos();
  const jogadores = [
    criarJogador('j1', 'J1'),
    criarJogador('j2', 'J2'),
    criarJogador('j3', 'J3'),
    criarJogador('j4', 'J4'),
  ];
  const decisores = new Map<string, DecisorJogada>(jogadores.map((j) => [j.id, criarDecisorPrimeiraCarta()]));
  const rodada = criarRodadaComMao({ jogadores, decisores, emissor, maos, manilha });
  return { emissor, rodada, jogadores };
}

async function jogarTurnos(rodada: Rodada, quantidade: number): Promise<void> {
  for (let i = 0; i < quantidade; i++) {
    await rodada.jogarTurno();
  }
}

describe('Rodada — empate entre não-manilhas do mesmo valor', () => {
  it('deve retornar empate quando duas não-manilhas do mesmo valor competem', async () => {
    const { emissor, rodada } = criarRodadaEmpate([
      [criarCarta('7', '♣')],
      [criarCarta('7', '♥')],
      [criarCarta('5', '♠')],
      [criarCarta('4', '♦')],
    ]);
    const handler = vi.fn<(ev: unknown) => void>();
    emissor.on('TURNO_EMPATADO', handler);
    await jogarTurnos(rodada, 4);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(estadoEmJogo(rodada.estado).vazas).toEqual({});
  });

  it('não deve incrementar vaza para nenhum jogador no empate', async () => {
    const { rodada } = criarRodadaEmpate([
      [criarCarta('7', '♣')],
      [criarCarta('7', '♥')],
      [criarCarta('5', '♠')],
      [criarCarta('4', '♦')],
    ]);
    await jogarTurnos(rodada, 4);
    expect(estadoEmJogo(rodada.estado).vazas['j1']).toBeUndefined();
    expect(estadoEmJogo(rodada.estado).vazas['j2']).toBeUndefined();
    expect(estadoEmJogo(rodada.estado).vazas['j3']).toBeUndefined();
    expect(estadoEmJogo(rodada.estado).vazas['j4']).toBeUndefined();
  });
});

describe('Rodada — empate e próximo turno', () => {
  it('deve fazer o último empatado iniciar o próximo turno', async () => {
    const { rodada } = criarRodadaEmpate([
      [criarCarta('7', '♣'), criarCarta('A', '♣')],
      [criarCarta('7', '♥'), criarCarta('K', '♥')],
      [criarCarta('5', '♠'), criarCarta('Q', '♠')],
      [criarCarta('4', '♦'), criarCarta('J', '♦')],
    ]);
    await jogarTurnos(rodada, 4);
    expect(rodada.estado.jogadorAtual).toBe(1); // j2 foi o último empatado
    expect(estadoEmJogo(rodada.estado).turno).toBe(2);
  });

  it('deve fazer o último empatado iniciar quando o naipe maior é jogado por último', async () => {
    const { rodada } = criarRodadaEmpate([
      [criarCarta('7', '♥'), criarCarta('A', '♥')],
      [criarCarta('7', '♣'), criarCarta('K', '♣')],
      [criarCarta('5', '♠'), criarCarta('Q', '♠')],
      [criarCarta('4', '♦'), criarCarta('J', '♦')],
    ]);
    await jogarTurnos(rodada, 4);
    expect(rodada.estado.jogadorAtual).toBe(1); // j2 foi o último empatado
    expect(estadoEmJogo(rodada.estado).turno).toBe(2);
  });
});

describe('Rodada — manilha vs não-manilha não é empate', () => {
  it('deve fazer manilha vencer carta não-manilha', async () => {
    const { rodada } = criarRodadaEmpate(
      [[criarCarta('3', '♦')], [criarCarta('4', '♣')], [criarCarta('5', '♠')], [criarCarta('6', '♥')]],
      '4',
    );
    await jogarTurnos(rodada, 4);
    expect(estadoEmJogo(rodada.estado).vazas['j2']).toBe(1);
  });
});

describe('Rodada — desempate entre manilhas por naipe', () => {
  it('deve desempatar 4 manilhas diferentes pelo naipe', async () => {
    const { rodada } = criarRodadaEmpate(
      [[criarCarta('4', '♦')], [criarCarta('4', '♠')], [criarCarta('4', '♥')], [criarCarta('4', '♣')]],
      '4',
    );
    await jogarTurnos(rodada, 4);
    expect(estadoEmJogo(rodada.estado).vazas['j4']).toBe(1);
  });
});
