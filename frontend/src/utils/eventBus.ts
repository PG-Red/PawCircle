type Handler<T = unknown> = (payload: T) => void;

const listeners: Record<string, Handler[]> = {};

export const eventBus = {
  on<T>(event: string, handler: Handler<T>) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(handler as Handler);
  },
  off<T>(event: string, handler: Handler<T>) {
    if (!listeners[event]) return;
    listeners[event] = listeners[event].filter(h => h !== handler);
  },
  emit<T>(event: string, payload: T) {
    listeners[event]?.forEach(h => h(payload));
  },
};

