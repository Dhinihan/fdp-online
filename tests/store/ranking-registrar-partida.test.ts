import { describe, expect, it } from 'vitest';
import { registrarPartida } from '@/store/ranking/registrar-partida';
import { SNAPSHOT_VAZIO, type ParticipantePersistido, type SnapshotRanking } from '@/store/ranking/tipos';
import type { Jogador } from '@/types/entidades';

function jogador(id: string, nome: string): Jogador {
  return { id, nome, pontos: 0 };
}

function part(nomeExibicao: string, somatorios: [number, number, number]): ParticipantePersistido {
  const [partidas, vitorias, somaPosicoes] = somatorios;
  return { nomeExibicao, partidas, vitorias, somaPosicoes };
}

const classificacao: Jogador[] = [jogador('humano', 'Você'), jogador('bot1', 'Brás'), jogador('bot2', 'Iara')];

describe('registrarPartida', () => {
  it('registra somatórios brutos da primeira partida a partir do snapshot vazio', () => {
    const { participantes } = registrarPartida(SNAPSHOT_VAZIO, classificacao);

    expect(participantes['humano']).toEqual(part('Você', [1, 1, 1]));
    expect(participantes['bot:bras']).toEqual(part('Brás', [1, 0, 2]));
    expect(participantes['bot:iara']).toEqual(part('Iara', [1, 0, 3]));
  });

  it('acumula sobre um snapshot existente sem perder os outros participantes', () => {
    const inicial: SnapshotRanking = {
      versao: 1,
      participantes: { humano: part('Você', [2, 1, 3]), 'bot:fabiano': part('Fabiano', [2, 0, 6]) },
    };

    const { participantes } = registrarPartida(inicial, classificacao);

    expect(participantes['humano']).toEqual(part('Você', [3, 2, 4]));
    expect(participantes['bot:bras']).toEqual(part('Brás', [1, 0, 2]));
    expect(participantes['bot:fabiano']).toMatchObject({ partidas: 2 });
  });

  it('conta a posição ordinal dos eliminados (denominador inclui quem apareceu)', () => {
    const { participantes } = registrarPartida(SNAPSHOT_VAZIO, classificacao);

    expect(participantes['bot:iara']).toMatchObject({ somaPosicoes: 3, partidas: 1 });
  });

  it('não muta o snapshot de entrada', () => {
    const congelado: SnapshotRanking = { versao: 1, participantes: {} };
    registrarPartida(congelado, classificacao);

    expect(congelado.participantes).toEqual({});
  });
});
