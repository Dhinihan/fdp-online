import { describe, it, expect, vi } from 'vitest';
import { createEmissorEventos } from '@/store/emissor-eventos';
import { criarCarta, criarJogador, criarDecisor, criarRodada, criarRodadaComMao } from './rodada-fixtures';

describe('Rodada — hardening do decisor', () => {
  it('deve restaurar fase para aguardandoJogada quando decisor rejeita', async () => {
    const emissor = createEmissorEventos();
    const jogadores = [criarJogador('j1', 'Jogador 1')];
    const decisor = { decidirJogada: vi.fn().mockRejectedValue(new Error('Erro do decisor')) };
    const rodada = criarRodada({ jogadores, decisores: new Map([['j1', decisor]]), emissor });
    await expect(rodada.jogarTurno()).rejects.toThrow('Erro do decisor');
    expect(rodada.estado.fase).toBe('aguardandoJogada');
  });
});

describe('Rodada — hardening da jogada', () => {
  it('deve restaurar fase quando carta retornada não está na mão', async () => {
    const emissor = createEmissorEventos();
    const jogadores = [criarJogador('j1', 'Jogador 1')];
    const decisor = criarDecisor(criarCarta('5', '♥'));
    const rodada = criarRodadaComMao({
      jogadores,
      decisores: new Map([['j1', decisor]]),
      emissor,
      maos: [[criarCarta('4', '♣')]],
    });
    await expect(rodada.jogarTurno()).rejects.toThrow('Jogada inválida');
    expect(rodada.estado.fase).toBe('aguardandoJogada');
  });

  it('deve restaurar fase quando decisor não é encontrado', async () => {
    const emissor = createEmissorEventos();
    const jogadores = [criarJogador('j1', 'Jogador 1')];
    const rodada = criarRodadaComMao({
      jogadores,
      decisores: new Map(),
      emissor,
      maos: [[criarCarta('4', '♣')]],
    });
    await expect(rodada.jogarTurno()).rejects.toThrow('Decisor não encontrado');
    expect(rodada.estado.fase).toBe('aguardandoJogada');
  });
});
