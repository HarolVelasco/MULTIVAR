/**
 * GameState — Estado global del juego.
 * Solo stateMachine.js debe llamar a los setters.
 * Cualquier módulo puede llamar a los getters.
 */
const GameState = (() => {
  let state = {
    deck: [],            // Array de objetos carta completos
    flipped: [],         // Cartas actualmente volteadas (máx 2)
    matched: [],         // IDs de pares ya encontrados
    score: 0,
    combo: 0,
    timeLeft: 120,       // segundos
    isLocked: false,     // bloquea clicks durante animación/check
    phase: 'IDLE',       // IDLE | FLIPPING | CHECKING | MATCHED | MISMATCH | BONUS | WIN
  };

  return {
    get: () => ({ ...state }),

    set(partial) {
      state = { ...state, ...partial };
    },

    reset() {
      state = {
        deck: [],
        flipped: [],
        matched: [],
        score: 0,
        combo: 0,
        timeLeft: 120,
        isLocked: false,
        phase: 'IDLE',
      };
    },
  };
})();

export default GameState;