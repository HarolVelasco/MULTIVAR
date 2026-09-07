/**
 * EventBus — Singleton PubSub
 * Canal de comunicación desacoplado entre todos los módulos del juego.
 * Uso: EventBus.on('event', handler) / EventBus.emit('event', payload)
 */
const EventBus = (() => {
  const listeners = {};

  return {
    on(event, handler) {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(handler);
    },

    off(event, handler) {
      if (!listeners[event]) return;
      listeners[event] = listeners[event].filter(h => h !== handler);
    },

    emit(event, payload) {
      if (!listeners[event]) return;
      listeners[event].forEach(h => h(payload));
    },
  };
})();

export default EventBus;