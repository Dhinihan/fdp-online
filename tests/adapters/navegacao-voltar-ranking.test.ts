import { describe, expect, it, vi } from 'vitest';
import {
  type AlvoPopstate,
  type HistoricoNavegavel,
  NavegacaoVoltarRanking,
} from '@/adapters/phaser/scenes/navegacao-voltar-ranking';

class HistoricoFake implements HistoricoNavegavel {
  pushState = vi.fn();
  back = vi.fn();
}

class AlvoFake implements AlvoPopstate {
  private ouvintes: (() => void)[] = [];
  addEventListener = vi.fn((_tipo: 'popstate', ouvinte: () => void) => {
    this.ouvintes.push(ouvinte);
  });
  removeEventListener = vi.fn((_tipo: 'popstate', ouvinte: () => void) => {
    this.ouvintes = this.ouvintes.filter((o) => o !== ouvinte);
  });

  disparaVoltar(): void {
    this.ouvintes.forEach((o) => {
      o();
    });
  }

  get totalOuvintes(): number {
    return this.ouvintes.length;
  }
}

function montar() {
  const historico = new HistoricoFake();
  const alvo = new AlvoFake();
  const aoFechar = vi.fn<() => void>();
  const navegacao = new NavegacaoVoltarRanking(historico, alvo, aoFechar);
  return { historico, alvo, aoFechar, navegacao };
}

describe('NavegacaoVoltarRanking — ativação', () => {
  it('ao ativar empilha entrada no histórico e escuta popstate', () => {
    const { historico, alvo, navegacao } = montar();
    navegacao.ativar();
    expect(historico.pushState).toHaveBeenCalledOnce();
    expect(alvo.totalOuvintes).toBe(1);
  });

  it('ativar duas vezes não duplica a entrada nem o listener', () => {
    const { historico, alvo, navegacao } = montar();
    navegacao.ativar();
    navegacao.ativar();
    expect(historico.pushState).toHaveBeenCalledOnce();
    expect(alvo.totalOuvintes).toBe(1);
  });
});

describe('NavegacaoVoltarRanking — Voltar do browser', () => {
  it('fecha o Ranking sem chamar history.back', () => {
    const { historico, alvo, aoFechar, navegacao } = montar();
    navegacao.ativar();
    alvo.disparaVoltar();
    expect(aoFechar).toHaveBeenCalledOnce();
    expect(historico.back).not.toHaveBeenCalled();
    expect(alvo.totalOuvintes).toBe(0);
  });
});

describe('NavegacaoVoltarRanking — fechar pelo ×', () => {
  it('equilibra o histórico com back e não dispara o callback de Voltar', () => {
    const { historico, alvo, aoFechar, navegacao } = montar();
    navegacao.ativar();
    navegacao.fecharPelaUI();
    expect(historico.back).toHaveBeenCalledOnce();
    expect(aoFechar).not.toHaveBeenCalled();
    expect(alvo.totalOuvintes).toBe(0);
  });

  it('um popstate posterior não fecha o Ranking de novo', () => {
    const { aoFechar, alvo, navegacao } = montar();
    navegacao.ativar();
    navegacao.fecharPelaUI();
    alvo.disparaVoltar();
    expect(aoFechar).not.toHaveBeenCalled();
  });
});

describe('NavegacaoVoltarRanking — encerramento da cena', () => {
  it('encerrar remove o listener sem mexer no histórico', () => {
    const { historico, alvo, navegacao } = montar();
    navegacao.ativar();
    navegacao.encerrar();
    expect(alvo.totalOuvintes).toBe(0);
    expect(historico.back).not.toHaveBeenCalled();
  });

  it('um popstate após encerrar não fecha o Ranking', () => {
    const { aoFechar, alvo, navegacao } = montar();
    navegacao.ativar();
    navegacao.encerrar();
    alvo.disparaVoltar();
    expect(aoFechar).not.toHaveBeenCalled();
  });
});
