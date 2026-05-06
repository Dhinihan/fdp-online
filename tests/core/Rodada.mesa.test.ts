import { describe, it, expect } from 'vitest';
import { createEmissorEventos } from '@/store/emissor-eventos';
import {
  criarCarta,
  criarJogador,
  criarDecisor,
  criarDecisorPrimeiraCarta,
  criarRodada,
  criarRodadaComMao,
} from './rodada-fixtures';

describe('Rodada — mesa remoção', () => {
  it('deve remover carta jogada da mão do jogador', async () => {
    const emissor = createEmissorEventos();
    const jogadores = [criarJogador('j1', 'Jogador 1'), criarJogador('j2', 'Jogador 2')];
    const decisores = new Map([
      ['j1', criarDecisorPrimeiraCarta()],
      ['j2', criarDecisorPrimeiraCarta()],
    ]);
    const rodada = criarRodada({ jogadores, decisores, emissor });
    const cartaEsperada = rodada.estado.maos[0].cartas[0];
    const maoAntes = rodada.estado.maos[0].cartas.length;
    await rodada.jogarTurno();
    expect(rodada.estado.maos[0].cartas).toHaveLength(maoAntes - 1);
    expect(rodada.estado.mesa).toContainEqual(expect.objectContaining({ carta: cartaEsperada, jogadorId: 'j1' }));
  });
});

describe('Rodada — mesa referência', () => {
  it('deve remover carta por valor/naipe mesmo com referência diferente', async () => {
    const emissor = createEmissorEventos();
    const jogadores = [criarJogador('j1', 'Jogador 1'), criarJogador('j2', 'Jogador 2')];
    const decisor = criarDecisor(criarCarta('4', '♣'));
    const rodada = criarRodadaComMao({
      jogadores,
      decisores: new Map([
        ['j1', decisor],
        ['j2', criarDecisor(criarCarta('5', '♥'))],
      ]),
      emissor,
      maos: [[criarCarta('4', '♣')], [criarCarta('5', '♥')]],
      cartasPorRodada: 2,
    });
    await rodada.jogarTurno();
    expect(rodada.estado.maos[0].cartas).toHaveLength(0);
    expect(rodada.estado.mesa).toContainEqual(
      expect.objectContaining({ carta: criarCarta('4', '♣'), jogadorId: 'j1' }),
    );
  });
});
