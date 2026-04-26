import { describe, it, expect, beforeEach, vi } from 'vitest';
import { emissorEventos } from '@/store/emissor-eventos';
import type { ToqueBotao, EfeitoSomTocado } from '@/types';

function criarEventoBotao(id: string, botaoId: string): ToqueBotao {
  return { id, timestamp: 0, tipo: 'TOQUE_BOTAO', botaoId };
}

function criarEventoSom(id: string, somId: string): EfeitoSomTocado {
  return { id, timestamp: 0, tipo: 'EFEITO_SOM_TOCADO', somId };
}

describe('Emissor de Eventos — on + emit', () => {
  beforeEach(() => {
    emissorEventos.limpar();
  });

  it('deve chamar handler ao emitir evento com on', () => {
    const handler = vi.fn();
    emissorEventos.on('TOQUE_BOTAO', handler);
    emissorEventos.emit(criarEventoBotao('1', 'btn-1'));
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(criarEventoBotao('1', 'btn-1'));
  });

  it('deve chamar múltiplos handlers para o mesmo tipo', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    emissorEventos.on('TOQUE_BOTAO', handler1);
    emissorEventos.on('TOQUE_BOTAO', handler2);
    emissorEventos.emit(criarEventoBotao('1', 'btn-1'));
    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
  });
});

describe('Emissor de Eventos — off', () => {
  beforeEach(() => {
    emissorEventos.limpar();
  });

  it('deve remover handler com off', () => {
    const handler = vi.fn();
    emissorEventos.on('TOQUE_BOTAO', handler);
    emissorEventos.off('TOQUE_BOTAO', handler);
    emissorEventos.emit(criarEventoBotao('1', 'btn-1'));
    expect(handler).not.toHaveBeenCalled();
  });
});

describe('Emissor de Eventos — limpar', () => {
  beforeEach(() => {
    emissorEventos.limpar();
  });

  it('deve limpar handlers por tipo', () => {
    const handlerBotao = vi.fn();
    const handlerSom = vi.fn();
    emissorEventos.on('TOQUE_BOTAO', handlerBotao);
    emissorEventos.on('EFEITO_SOM_TOCADO', handlerSom);
    emissorEventos.limpar('TOQUE_BOTAO');
    emissorEventos.emit(criarEventoBotao('1', 'btn-1'));
    emissorEventos.emit(criarEventoSom('2', 'som-1'));
    expect(handlerBotao).not.toHaveBeenCalled();
    expect(handlerSom).toHaveBeenCalledTimes(1);
  });

  it('deve limpar todos os handlers ao chamar limpar sem argumento', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    emissorEventos.on('TOQUE_BOTAO', handler1);
    emissorEventos.on('EFEITO_SOM_TOCADO', handler2);
    emissorEventos.limpar();
    emissorEventos.emit(criarEventoBotao('1', 'btn-1'));
    emissorEventos.emit(criarEventoSom('2', 'som-1'));
    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).not.toHaveBeenCalled();
  });
});
