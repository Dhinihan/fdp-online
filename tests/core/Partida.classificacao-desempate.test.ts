import { describe, expect, it, vi } from 'vitest';
import { Partida } from '@/core/Partida';
import type { Rodada } from '@/core/Rodada';
import { createEmissorEventos } from '@/store/emissor-eventos';
import type { Jogador } from '@/types/entidades';
import type { EstadoMutavel } from '@/types/estado-rodada';
import type { EventoDominio } from '@/types/eventos-dominio';
import { criarDecisorPrimeiraCarta } from './rodada-fixtures';

function jogadores(ids: string[]): Jogador[] {
  return ids.map((id) => ({ id, nome: id, pontos: 5 }));
}

function criarPartidaComEmissor(ids: string[]): { emissor: ReturnType<typeof createEmissorEventos>; partida: Partida } {
  const lista = jogadores(ids);
  const emissor = createEmissorEventos();
  const decisoresJogada = new Map(lista.map((jogador) => [jogador.id, criarDecisorPrimeiraCarta()]));
  const partida = new Partida(lista, emissor, { jogada: decisoresJogada, declaracao: new Map() });
  return { emissor, partida };
}

function concluirRodadaComPontos(partida: Partida, pontos: Record<string, number>): void {
  const rodada = partida.iniciarProximaRodada() as Rodada;
  rodada.restaurarEstado({ ...rodada.estado, fase: 'rodadaConcluida', pontos } as EstadoMutavel);
}

function classificacaoAoEncerrar(ids: string[], pontos: Record<string, number>): Jogador[] {
  const { emissor, partida } = criarPartidaComEmissor(ids);
  const handler = vi.fn<(ev: EventoDominio) => void>();
  emissor.on('JOGO_ENCERRADO', handler);
  concluirRodadaComPontos(partida, pontos);
  partida.iniciarProximaRodada();
  const evento = handler.mock.calls[0][0];
  if (evento.tipo !== 'JOGO_ENCERRADO') throw new Error('Evento JOGO_ENCERRADO não emitido');
  return evento.classificacao;
}

describe('Partida — desempate da Classificação por pontos iguais', () => {
  it('deve colocar o jogador humano acima dos Perfis de Bot em empate de pontos', () => {
    const classificacao = classificacaoAoEncerrar(['bot1', 'humano', 'bot2'], { bot1: 0, humano: 0, bot2: 2 });

    expect(classificacao.map((j) => j.id)).toEqual(['bot2', 'humano', 'bot1']);
  });

  it('deve manter a ordem por pontos quando não há empate envolvendo o humano', () => {
    const classificacao = classificacaoAoEncerrar(['humano', 'bot1', 'bot2'], { humano: -1, bot1: 0, bot2: 3 });

    expect(classificacao.map((j) => j.id)).toEqual(['bot2', 'bot1', 'humano']);
  });
});
