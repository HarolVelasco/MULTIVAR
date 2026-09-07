import EventBus from './eventBus.js';
import GameState from './gameState.js';

/**
 * StateMachine — Maneja las transiciones de fase del juego.
 * Es el único módulo autorizado a mutar GameState.phase.
 *
 * Fases: IDLE → FLIPPING → CHECKING → MATCHED | MISMATCH → BONUS → IDLE | WIN
 */
const StateMachine = {

  /**
   * El jugador hace clic en una carta.
   * @param {Object} card — objeto carta del deck
   */
  onCardClick(card) {
    const state = GameState.get();

    // Bloquear si el juego está procesando o la carta ya fue resuelta
    if (state.isLocked) return;
    if (state.matched.includes(card.pairId)) return;
    if (state.flipped.find(c => c.id === card.id)) return;

    const newFlipped = [...state.flipped, card];
    GameState.set({ flipped: newFlipped, phase: 'FLIPPING' });
    EventBus.emit('card:flip', { card });

    // Con 2 cartas volteadas, pasar a CHECKING
    if (newFlipped.length === 2) {
      GameState.set({ isLocked: true, phase: 'CHECKING' });
      // Pequeño delay para que el jugador vea ambas caras
      setTimeout(() => StateMachine._checkPair(newFlipped), 900);
    }
  },

  _checkPair([cardA, cardB]) {
    const state = GameState.get();
    const isMatch = cardA.pairId === cardB.pairId;

    if (isMatch) {
      const newCombo  = state.combo + 1;
      const points    = 100 * newCombo;
      const newScore  = state.score + points;
      const newMatched = [...state.matched, cardA.pairId];

      GameState.set({
        matched: newMatched,
        score: newScore,
        combo: newCombo,
        flipped: [],
        isLocked: false,
        phase: 'MATCHED',
      });

      EventBus.emit('card:matched', { cardA, cardB, score: newScore, combo: newCombo });

      // Verificar victoria
      const totalPairs = GameState.get().deck.length / 2;
      if (newMatched.length === totalPairs) {
        GameState.set({ phase: 'WIN' });
        EventBus.emit('game:win', { score: newScore });
      }

    } else {
      GameState.set({ combo: 0, phase: 'MISMATCH' });
      EventBus.emit('card:mismatch', { cardA, cardB });

      setTimeout(() => {
        GameState.set({ flipped: [], isLocked: false, phase: 'IDLE' });
        EventBus.emit('card:reset', { cardA, cardB });
      }, 1000);
    }
  },
};

export default StateMachine;