import { describe, expect, it, vi } from 'vitest';
import type { Carta } from '@/core/Carta';
import type { DecisorJogada } from '@/core/portas/DecisorJogada';
import { createEmissorEventos } from '@/store/emissor-eventos';
import { estadoEmJogo, type EstadoRodada } from '@/types/estado-rodada';
import { criarCarta, criarDecisorPrimeiraCarta, criarRodadaComMao, jogadoresPadrao } from './rodada-fixtures';

const MAOS_FIXAS: Carta[][] = [
  [criarCarta('A', '♣')],
  [criarCarta('K', '♥')],
  [criarCarta('Q', '♠')],
  [criarCarta('J', '♦')],
];

function decisoresPrimeiraCarta(): Map<string, DecisorJogada> {
  return new Map(jogadoresPadrao().map((jogador) => [jogador.id, criarDecisorPrimeiraCarta()]));
}

function criarRodadaRegistro(decisores = decisoresPrimeiraCarta()) {
  return criarRodadaComMao({
    jogadores: jogadoresPadrao(),
    decisores,
    emissor: createEmissorEventos(),
    maos: MAOS_FIXAS,
  });
}

describe('Rodada — registro de cartas reveladas', () => {
  it('deve registrar carta jogada na mesa', async () => {
    const rodada = criarRodadaRegistro();
    await rodada.jogarTurno();
    expect(estadoEmJogo(rodada.estado).cartasReveladas).toEqual([criarCarta('A', '♣')]);
  });

  it('deve acumular cartas reveladas ao longo de múltiplos turnos', async () => {
    const rodada = criarRodadaRegistro();
    await rodada.jogarTurno();
    await rodada.jogarTurno();
    expect(estadoEmJogo(rodada.estado).cartasReveladas).toEqual([criarCarta('A', '♣'), criarCarta('K', '♥')]);
  });

  it('deve iniciar sem cartas reveladas ao distribuir rodada comum', () => {
    const rodada = criarRodadaRegistro();
    expect(estadoEmJogo(rodada.estado).cartasReveladas).toEqual([]);
  });
});

describe('Rodada — decisores com cartas reveladas', () => {
  it('deve passar cartas reveladas no snapshot recebido pelo decisor', async () => {
    const decidirJogada = vi.fn<(mao: Carta[], estado: EstadoRodada) => Promise<Carta>>();
    decidirJogada.mockResolvedValue(criarCarta('K', '♥'));
    const rodada = criarRodadaRegistro(
      new Map<string, DecisorJogada>([
        ['j1', criarDecisorPrimeiraCarta()],
        ['j2', { decidirJogada }],
        ['j3', criarDecisorPrimeiraCarta()],
        ['j4', criarDecisorPrimeiraCarta()],
      ]),
    );
    await rodada.jogarTurno();
    await rodada.jogarTurno();
    expect(estadoEmJogo(decidirJogada.mock.calls[0][1]).cartasReveladas).toEqual([criarCarta('A', '♣')]);
  });
});
