import type { EventoBase, EventoMap } from '@/types';

type Handler<T extends keyof EventoMap> = (evento: EventoMap[T]) => void;

const handlers = new Map<string, Set<Handler<keyof EventoMap>>>();

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

function emit(evento: EventoBase): void {
  const conjunto = handlers.get(evento.tipo);
  if (conjunto) {
    conjunto.forEach((handler) => {
      handler(evento as EventoMap[keyof EventoMap]);
    });
  }
}

function limpar(tipo?: keyof EventoMap): void {
  if (tipo) {
    handlers.delete(tipo);
  } else {
    handlers.clear();
  }
}

export const emissorEventos = { on, off, emit, limpar };
