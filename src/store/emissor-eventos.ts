import type { EventoMap, EventoUnion } from '@/types';

type Handler<T extends keyof EventoMap> = (evento: EventoMap[T]) => void;

export function createEmissorEventos() {
  const handlers = new Map<keyof EventoMap, Set<Handler<keyof EventoMap>>>();

  function on<T extends keyof EventoMap>(tipo: T, handler: Handler<T>): void {
    let conjunto = handlers.get(tipo);
    if (!conjunto) {
      conjunto = new Set();
      handlers.set(tipo, conjunto);
    }
    conjunto.add(handler as Handler<keyof EventoMap>);
  }

  function off<T extends keyof EventoMap>(tipo: T, handler: Handler<T>): void {
    handlers.get(tipo)?.delete(handler as Handler<keyof EventoMap>);
  }

  function emit(evento: EventoUnion): void {
    handlers.get(evento.tipo)?.forEach((handler) => {
      handler(evento);
    });
  }

  function limpar(tipo?: keyof EventoMap): void {
    if (tipo) handlers.delete(tipo);
    else handlers.clear();
  }

  return { on, off, emit, limpar };
}

export const emissorEventos = createEmissorEventos();
