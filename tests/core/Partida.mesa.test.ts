import { describe, it, expect } from 'vitest';
import { createEmissorEventos } from '@/store/emissor-eventos';
import {
  criarCarta,
  criarJogador,
  criarDecisor,
  criarDecisorPrimeiraCarta,
  criarPartida,
  criarPartidaComMao,
} from './partida-fixtures';

describe('Partida — mesa remoção', () => {
  it('deve remover carta jogada da mão do jogador', async () => {
    const emissor = createEmissorEventos();
    const jogadores = [criarJogador('j1', 'Jogador 1'), criarJogador('j2', 'Jogador 2')];
    const decisores = new Map([
      ['j1', criarDecisorPrimeiraCarta()],
      ['j2', criarDecisorPrimeiraCarta()],
    ]);
    const partida = criarPartida({ jogadores, decisores, emissor });
    const cartaEsperada = partida.estado.maos[0].cartas[0];
    const maoAntes = partida.estado.maos[0].cartas.length;
    await partida.jogarTurno();
    expect(partida.estado.maos[0].cartas).toHaveLength(maoAntes - 1);
    expect(partida.estado.mesa).toContainEqual(expect.objectContaining({ carta: cartaEsperada, jogadorId: 'j1' }));
  });
});

describe('Partida — mesa referência', () => {
  it('deve remover carta por valor/naipe mesmo com referência diferente', async () => {
    const emissor = createEmissorEventos();
    const jogadores = [criarJogador('j1', 'Jogador 1'), criarJogador('j2', 'Jogador 2')];
    const decisor = criarDecisor(criarCarta('4', '♣'));
    const partida = criarPartidaComMao({
      jogadores,
      decisores: new Map([
        ['j1', decisor],
        ['j2', criarDecisor(criarCarta('5', '♥'))],
      ]),
      emissor,
      maos: [[criarCarta('4', '♣')], [criarCarta('5', '♥')]],
      cartasPorRodada: 2,
    });
    await partida.jogarTurno();
    expect(partida.estado.maos[0].cartas).toHaveLength(0);
    expect(partida.estado.mesa).toContainEqual(
      expect.objectContaining({ carta: criarCarta('4', '♣'), jogadorId: 'j1' }),
    );
  });
});
