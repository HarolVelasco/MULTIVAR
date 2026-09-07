/**
 * timerSystem.js — Countdown del juego CalcMatch.
 *
 * Fix: reset() ya NO emite timer:tick ni toca GameState con valor
 * hardcodeado. Solo detiene el loop interno. El valor visible en
 * el HUD lo actualiza UIManager.reset() llamado desde main.js
 * después de saber la dificultad real.
 */

import EventBus  from '../core/eventBus.js';
import GameState from '../core/gameState.js';

const TimerSystem = (() => {
  let rafId    = null;
  let lastTick = null;
  let timeLeft = 90;
  let running  = false;

  function loop(timestamp) {
    if (!running) return;

    if (lastTick === null) lastTick = timestamp;

    const elapsed = timestamp - lastTick;

    if (elapsed >= 1000) {
      const ticks = Math.floor(elapsed / 1000);
      lastTick = timestamp - (elapsed % 1000);
      timeLeft = Math.max(0, timeLeft - ticks);
      GameState.set({ timeLeft });
      EventBus.emit('timer:tick', { timeLeft });

      if (timeLeft <= 0) {
        running = false;
        EventBus.emit('timer:expired', {});
        return;
      }
    }

    rafId = requestAnimationFrame(loop);
  }

  return {
    /** Arranca el countdown desde `seconds`. */
    start(seconds = 90) {
      if (running) return;
      timeLeft = seconds;
      running  = true;
      lastTick = null;
      GameState.set({ timeLeft });
      // Emitir tick inicial para que el HUD muestre el valor correcto
      // desde el primer frame sin esperar 1 segundo.
      EventBus.emit('timer:tick', { timeLeft });
      rafId = requestAnimationFrame(loop);
    },

    /** Para el loop sin resetear el valor. */
    stop() {
      running = false;
      if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
    },

    /**
     * Para el loop Y limpia estado interno.
     * NO emite eventos — evita que el HUD parpadee con 1:30.
     * El valor del HUD lo actualiza UIManager.reset() en main.js.
     */
    reset() {
      running  = false;
      lastTick = null;
      if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
      // timeLeft se sobreescribe en el próximo start(seconds)
    },

    addTime(seconds) {
      timeLeft = Math.min(timeLeft + seconds, 999);
      GameState.set({ timeLeft });
      EventBus.emit('timer:tick', { timeLeft });
    },

    getTimeLeft() { return timeLeft; },
  };
})();

export default TimerSystem;