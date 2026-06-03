import { describe, expect, it } from 'vitest';
import type { Nivel } from '@/store/trofeus/tabela-trofeus';
import { NIVEIS_ORDENADOS } from '@/store/trofeus/tabela-trofeus';
import { SNAPSHOT_ZERO, type SnapshotTrofeus } from '@/store/trofeus/tipos';
import { aplicarTransicao } from '@/store/trofeus/transicao-trofeus';

function snapshot(sequenciaAtual: number, maiorTrofeu: Nivel | null = null): SnapshotTrofeus {
  return { versao: 1, sequenciaAtual, maiorTrofeu };
}

describe('aplicarTransicao quando o humano venceu', () => {
  it('incrementa a sequência em 1 a partir do zero sem desbloquear nada', () => {
    const { snapshot: novo, resultado } = aplicarTransicao(SNAPSHOT_ZERO, true);

    expect(novo.sequenciaAtual).toBe(1);
    expect(resultado).toEqual({ sequenciaAtual: 1, trofeuDesbloqueado: null });
  });

  it('incrementa a sequência já existente', () => {
    const { snapshot: novo } = aplicarTransicao(snapshot(7, 'prata'), true);

    expect(novo.sequenciaAtual).toBe(8);
  });
});

describe('aplicarTransicao desbloqueia Troféus ao cruzar o limiar acima do maiorTrofeu', () => {
  it('desbloqueia Bronze ao atingir 3 vindo de nenhum Troféu', () => {
    const { snapshot: novo, resultado } = aplicarTransicao(snapshot(2, null), true);

    expect(novo.maiorTrofeu).toBe('bronze');
    expect(resultado).toEqual({ sequenciaAtual: 3, trofeuDesbloqueado: 'bronze' });
  });

  it('desbloqueia Prata ao atingir 5 já tendo Bronze', () => {
    const { snapshot: novo, resultado } = aplicarTransicao(snapshot(4, 'bronze'), true);

    expect(novo.maiorTrofeu).toBe('prata');
    expect(resultado?.trofeuDesbloqueado).toBe('prata');
  });

  it('não desbloqueia entre dois marcos', () => {
    const { snapshot: novo, resultado } = aplicarTransicao(snapshot(3, 'bronze'), true);

    expect(novo.maiorTrofeu).toBe('bronze');
    expect(resultado?.trofeuDesbloqueado).toBeNull();
  });

  it('desbloqueia no máximo um Troféu por Partida', () => {
    // Mesmo partindo de uma sequência alta com maiorTrofeu defasado, sobe só um nível.
    const { snapshot: novo, resultado } = aplicarTransicao(snapshot(9, 'bronze'), true);

    expect(novo.maiorTrofeu).toBe('prata');
    expect(resultado?.trofeuDesbloqueado).toBe('prata');
  });

  it('não desbloqueia nada após o Diamante (não há próximo nível)', () => {
    const { snapshot: novo, resultado } = aplicarTransicao(snapshot(150, 'diamante'), true);

    expect(novo.maiorTrofeu).toBe('diamante');
    expect(resultado?.trofeuDesbloqueado).toBeNull();
  });
});

describe('aplicarTransicao não recelebra marcos já conquistados', () => {
  it('mantém maiorTrofeu e não desbloqueia ao repassar um marco após zerar', () => {
    // Já tinha Prata; sequência zerou e voltou a cruzar 3 (limiar do Bronze).
    const { snapshot: novo, resultado } = aplicarTransicao(snapshot(2, 'prata'), true);

    expect(novo.maiorTrofeu).toBe('prata');
    expect(resultado?.trofeuDesbloqueado).toBeNull();
  });
});

describe('aplicarTransicao quando o humano não venceu', () => {
  it('zera a sequência mas preserva o maiorTrofeu (Troféus são permanentes)', () => {
    const { snapshot: novo, resultado } = aplicarTransicao(snapshot(7, 'ouro'), false);

    expect(novo.sequenciaAtual).toBe(0);
    expect(novo.maiorTrofeu).toBe('ouro');
    expect(resultado).toBeNull();
  });
});

describe('aplicarTransicao preserva o contrato e a imutabilidade', () => {
  it('mantém versão 1', () => {
    expect(aplicarTransicao(snapshot(2), true).snapshot.versao).toBe(1);
  });

  it('não muta o snapshot recebido', () => {
    const original = snapshot(2, 'bronze');

    aplicarTransicao(original, true);

    expect(original).toEqual({ versao: 1, sequenciaAtual: 2, maiorTrofeu: 'bronze' });
  });
});

describe('propriedade: vencendo em sequência, o maiorTrofeu sobe um nível por vez (nunca pula)', () => {
  it('atravessa todos os limiares conquistando cada nível exatamente uma vez', () => {
    let estado: SnapshotTrofeus = SNAPSHOT_ZERO;
    const desbloqueados: Nivel[] = [];

    for (let i = 0; i < 100; i++) {
      const { snapshot: novo, resultado } = aplicarTransicao(estado, true);
      if (resultado?.trofeuDesbloqueado) desbloqueados.push(resultado.trofeuDesbloqueado);
      estado = novo;
    }

    expect(desbloqueados).toEqual([...NIVEIS_ORDENADOS]);
  });
});
