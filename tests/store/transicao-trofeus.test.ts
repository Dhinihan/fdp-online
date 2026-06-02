import { describe, expect, it } from 'vitest';
import { SNAPSHOT_ZERO, type SnapshotTrofeus } from '@/store/trofeus/tipos';
import { aplicarTransicao } from '@/store/trofeus/transicao-trofeus';

function comSequencia(sequenciaAtual: number): SnapshotTrofeus {
  return { versao: 1, sequenciaAtual, maiorTrofeu: null };
}

describe('aplicarTransicao quando o humano venceu', () => {
  it('incrementa a sequência em 1 a partir do zero', () => {
    const { snapshot, resultado } = aplicarTransicao(SNAPSHOT_ZERO, true);

    expect(snapshot.sequenciaAtual).toBe(1);
    expect(resultado).toEqual({ sequenciaAtual: 1 });
  });

  it('incrementa a sequência já existente', () => {
    const { snapshot, resultado } = aplicarTransicao(comSequencia(4), true);

    expect(snapshot.sequenciaAtual).toBe(5);
    expect(resultado).toEqual({ sequenciaAtual: 5 });
  });
});

describe('aplicarTransicao quando o humano não venceu', () => {
  it('zera a sequência persistida mas não devolve nada a exibir', () => {
    const { snapshot, resultado } = aplicarTransicao(comSequencia(7), false);

    expect(snapshot.sequenciaAtual).toBe(0);
    expect(resultado).toBeNull();
  });

  it('mantém a sequência zerada ao perder partindo do zero', () => {
    const { snapshot } = aplicarTransicao(SNAPSHOT_ZERO, false);

    expect(snapshot.sequenciaAtual).toBe(0);
  });
});

describe('aplicarTransicao preserva o contrato persistido', () => {
  it('mantém versão 1 e maiorTrofeu nulo (slice atual)', () => {
    const { snapshot } = aplicarTransicao(comSequencia(2), true);

    expect(snapshot.versao).toBe(1);
    expect(snapshot.maiorTrofeu).toBeNull();
  });

  it('não muta o snapshot recebido', () => {
    const original = comSequencia(3);

    aplicarTransicao(original, true);

    expect(original.sequenciaAtual).toBe(3);
  });
});
