/**
 * scoreSystem.js — Sistema de puntuación de CalcMatch.
 *
 * Reglas:
 *   • +100 pts por pareja correcta (base)
 *   • Multiplicador de combo: ×1, ×2, ×3… por aciertos consecutivos
 *   • Bonus al ganar: timeLeft × 10 pts
 *   • Mismatch → combo se resetea a 0
 *
 * Escucha eventos del EventBus y emite:
 *   'score:updated'  → { score, combo, points }   tras cada pareja
 *   'score:bonus'    → { bonus, finalScore }       al ganar con tiempo
 *
 * API pública:
 *   ScoreSystem.init()   — suscribe a los eventos (llamar una vez al arrancar)
 *   ScoreSystem.reset()  — limpia estado interno
 *   ScoreSystem.get()    → { score, combo }
 */

import EventBus  from '../core/eventBus.js';
import GameState from '../core/gameState.js';

const POINTS_PER_PAIR = 100;
const TIME_BONUS_MULT = 10;   // pts por segundo restante

const ScoreSystem = (() => {
  let score = 0;
  let combo = 0;

  // ─── Handlers ─────────────────────────────────────────────

  function onMatched() {
    combo += 1;
    const multiplier = combo;
    const points     = POINTS_PER_PAIR * multiplier;
    score += points;

    GameState.set({ score, combo });
    EventBus.emit('score:updated', { score, combo, points });
  }

  function onMismatch() {
    combo = 0;
    GameState.set({ combo });
    // No emitimos score:updated — el score no cambia, solo el combo
    EventBus.emit('score:updated', { score, combo, points: 0 });
  }

  function onWin() {
    const { timeLeft } = GameState.get();
    const bonus        = timeLeft * TIME_BONUS_MULT;
    score += bonus;

    GameState.set({ score });
    EventBus.emit('score:bonus', { bonus, finalScore: score });
  }

  // ─── API pública ──────────────────────────────────────────

  return {
    init() {
      EventBus.on('card:matched',  onMatched);
      EventBus.on('card:mismatch', onMismatch);
      EventBus.on('game:win',      onWin);
    },

    reset() {
      score = 0;
      combo = 0;
      GameState.set({ score: 0, combo: 0 });
    },

    get() {
      return { score, combo };
    },
  };
})();

export default ScoreSystem;