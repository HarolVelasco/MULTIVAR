/**
 * powerUps.js — Sistema de comodines.
 *
 * Comodines:
 *   reveal   — Revelar Par: voltea 2 cartas sin emparejar por 1.5s
 *   freeze   — Congelar Tiempo: +10s al reloj
 *   magnet   — Imán Matemático: resuelve un par, consume todo el combo
 *
 * API pública:
 *   PowerUps.init(timerSystem) — registra el timer para freeze
 *   PowerUps.use(type)         — ejecuta el comodín
 *   PowerUps.reset()           — restaura usos al inicio de partida
 */

import EventBus    from '../core/eventBus.js';
import GameState   from '../core/gameState.js';
import StateMachine from '../core/stateMachine.js';

// Usos disponibles por partida
const MAX_USES = { reveal: 1, freeze: 2, magnet: 1 };

const PowerUps = (() => {
  let uses        = { ...MAX_USES };
  let timerSystem = null;

  // ─── Revelar Par ──────────────────────────────────────────
  // Busca el primer par no emparejado, los voltea 1.5s y los cierra.

  function reveal() {
    if (uses.reveal <= 0) return notify('Sin usos de Revelar Par');

    const { deck, matched, isLocked } = GameState.get();
    if (isLocked) return;

    // Buscar el primer pairId no emparejado
    const unseenPairId = deck
      .filter(c => !matched.includes(c.pairId))
      .map(c => c.pairId)
      .find((id, _, arr) => arr.filter(x => x === id).length >= 2);

    if (!unseenPairId) return;

    const pair = deck.filter(c => c.pairId === unseenPairId);
    if (pair.length < 2) return;

    uses.reveal--;
    GameState.set({ isLocked: true });

    // Voltear ambas visualmente
    pair.forEach(card => {
      const el = document.querySelector(`[data-id="${card.id}"]`);
      if (!el) return;
      // Asegurar render del canvas si es tipo graph
      const front = el.querySelector('.card__front--graph');
      if (front?._canvas && front._canvas.dataset.rendered !== '1') {
        import('../engine/render2D.js').then(({ renderConic }) => {
          renderConic(front._canvas, front._conic);
          front._canvas.dataset.rendered = '1';
        });
      }
      el.classList.add('is-flipped', 'powerup-reveal');
    });

    EventBus.emit('powerup:used', { type: 'reveal', usesLeft: uses.reveal });

    setTimeout(() => {
      pair.forEach(card => {
        const el = document.querySelector(`[data-id="${card.id}"]`);
        el?.classList.remove('is-flipped', 'powerup-reveal');
      });
      GameState.set({ isLocked: false });
    }, 1500);
  }

  // ─── Congelar Tiempo ──────────────────────────────────────

  function freeze() {
    if (uses.freeze <= 0) return notify('Sin usos de Congelar Tiempo');
    if (!timerSystem) return;

    uses.freeze--;
    const { timeLeft } = GameState.get();
    const newTime = Math.min(timeLeft + 25, 90);

    GameState.set({ timeLeft: newTime });
    timerSystem.addTime(10);

    EventBus.emit('powerup:used', { type: 'freeze', usesLeft: uses.freeze });
    EventBus.emit('timer:tick',   { timeLeft: newTime });
  }

  // ─── Imán Matemático ──────────────────────────────────────
  // Resuelve automáticamente el par con mayor dificultad no resuelto.
  // Consume todo el combo acumulado.

  function magnet() {
    if (uses.magnet <= 0) return notify('Sin usos de Imán Matemático');

    const { deck, matched, isLocked, combo } = GameState.get();
    if (isLocked) return;
    // Sin restricción de combo — funciona siempre que haya pares

    // Buscar par no emparejado de mayor dificultad
    const unseenPairs = deck
      .filter(c => !matched.includes(c.pairId))
      .reduce((acc, card) => {
        if (!acc[card.pairId]) acc[card.pairId] = { pairId: card.pairId, cards: [], difficulty: card.conic?.difficulty ?? 1 };
        acc[card.pairId].cards.push(card);
        return acc;
      }, {});

    const targetPair = Object.values(unseenPairs)
      .filter(p => p.cards.length >= 2)
      .sort((a, b) => b.difficulty - a.difficulty)[0];

    if (!targetPair) return;

    uses.magnet--;
    GameState.set({ isLocked: true, combo: 0 });

    const [cardA, cardB] = targetPair.cards;

    // Voltear brevemente para mostrar qué se resolvió
    [cardA, cardB].forEach(card => {
      document.querySelector(`[data-id="${card.id}"]`)
        ?.classList.add('is-flipped');
    });

    setTimeout(() => {
      // Forzar emparejamiento
      const newMatched = [...GameState.get().matched, targetPair.pairId];
      GameState.set({ matched: newMatched, isLocked: false, combo: 0 });

      [cardA, cardB].forEach(card => {
        document.querySelector(`[data-id="${card.id}"]`)
          ?.classList.add('is-matched');
      });

      EventBus.emit('card:matched', { cardA, cardB, score: GameState.get().score, combo: 0 });
      EventBus.emit('powerup:used', { type: 'magnet', usesLeft: uses.magnet });

      const totalPairs = deck.length / 2;
      if (newMatched.length === totalPairs) {
        GameState.set({ phase: 'WIN' });
        EventBus.emit('game:win', { score: GameState.get().score });
      }
    }, 900);
  }

  // ─── Notificación de error de uso ─────────────────────────

  function notify(msg) {
    EventBus.emit('powerup:error', { msg });
    console.info(`[PowerUps] ${msg}`);
  }

  // ─── API pública ──────────────────────────────────────────

  const ACTIONS = { reveal, freeze, magnet };

  return {
    init(timer) {
      timerSystem = timer;

      // Escuchar clicks en los botones del HUD
      document.querySelectorAll('[data-powerup]').forEach(btn => {
        btn.addEventListener('click', () => {
          PowerUps.use(btn.dataset.powerup);
        });
      });

      // Actualizar badges de usos restantes
      EventBus.on('powerup:used', ({ type, usesLeft }) => {
        const badge = document.querySelector(`[data-powerup="${type}"] .pu-uses`);
        if (badge) badge.textContent = usesLeft;
      });
    },

    use(type) {
      const fn = ACTIONS[type];
      if (fn) fn();
      else console.warn(`[PowerUps] Comodín desconocido: "${type}"`);
    },

    reset() {
      uses = { ...MAX_USES };
      document.querySelectorAll('[data-powerup]').forEach(btn => {
        const type  = btn.dataset.powerup;
        const badge = btn.querySelector('.pu-uses');
        if (badge) badge.textContent = MAX_USES[type] ?? 0;
        btn.disabled = false;
      });
    },

    getUses() { return { ...uses }; },
  };
})();

export default PowerUps;