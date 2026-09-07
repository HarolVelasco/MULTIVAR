/**
 * cardEngine.js — Motor de cartas del juego CalcMatch.
 *
 * Responsabilidades:
 *  1. Tomar CONICS y generar un deck con 2 cartas por cónica (ecuación + gráfica).
 *  2. Barajar el deck con Fisher-Yates.
 *  3. Crear el nodo DOM de cada carta con su cara frontal renderizada.
 *  4. Carta tipo A → KaTeX.  Carta tipo B → Canvas 2D (render2D.js).
 *  5. Agregar event listeners de clic que delegan en StateMachine.
 *  6. Exponer initBoard(container) como única API pública.
 */

import katex from 'katex';
import { CONICS } from '../data/conics.js';
import { renderConic } from './render2d.js';
import StateMachine from '../core/stateMachine.js';
import EventBus from '../core/eventBus.js';
import GameState from '../core/gameState.js';

// ─── 1. Generación del deck ────────────────────────────────────────────────

/**
 * Crea el array de objetos carta a partir de CONICS.
 * Cada cónica produce 2 cartas que comparten el mismo pairId.
 *
 * Estructura de una carta:
 * {
 *   id:      string único (ej. 'ellipse-1-equation')
 *   pairId:  string compartido entre los 2 (ej. 'ellipse-1')
 *   face:    'equation' | 'graph'
 *   conic:   referencia al objeto CONIC original
 * }
 */
function buildDeck(conics) {
  const deck = [];

  conics.forEach(conic => {
    // Carta A — ecuación LaTeX
    deck.push({
      id:     `${conic.id}-equation`,
      pairId: conic.id,
      face:   'equation',
      conic,
    });

    // Carta B — gráfica 2D
    deck.push({
      id:     `${conic.id}-graph`,
      pairId: conic.id,
      face:   'graph',
      conic,
    });
  });

  return deck;
}

// ─── 2. Shuffle (Fisher-Yates) ─────────────────────────────────────────────

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ─── 3. Construcción del DOM de cada carta ─────────────────────────────────

/**
 * Crea el elemento DOM completo de una carta.
 *
 * Estructura HTML generada:
 * <div class="card" data-id="..." data-pair-id="..." data-face="...">
 *   <div class="card__inner">
 *     <div class="card__back">  ← cara oculta (dorso) </div>
 *     <div class="card__front"> ← contenido visible al voltear </div>
 *   </div>
 * </div>
 */
function createCardElement(card) {
  const el = document.createElement('div');
  el.classList.add('card');
  el.dataset.id     = card.id;
  el.dataset.pairId = card.pairId;
  el.dataset.face   = card.face;

  // Badge de tipo (esquina superior derecha, visible en el dorso)
  const inner = document.createElement('div');
  inner.classList.add('card__inner');

  // ── Dorso ──────────────────────────────────────────────────────────────
  const back = document.createElement('div');
  back.classList.add('card__back');

  const backIcon = document.createElement('div');
  backIcon.classList.add('card__back-icon');
  backIcon.innerHTML = card.face === 'equation'
    ? '<span class="card__type-badge card__type-badge--eq">∑</span>'
    : '<span class="card__type-badge card__type-badge--graph">◈</span>';
  back.appendChild(backIcon);

  // ── Frente ─────────────────────────────────────────────────────────────
  const front = document.createElement('div');
  front.classList.add('card__front');

  if (card.face === 'equation') {
    buildEquationFace(front, card);
  } else {
    buildGraphFace(front, card);
  }

  inner.appendChild(back);
  inner.appendChild(front);
  el.appendChild(inner);

  // Input de nombre — solo para cartas de ecuación, fuera de la carta
  // Se envuelve en un contenedor que incluye carta + input
  if (card.face === 'equation') {
    const wrapper = document.createElement('div');
    wrapper.classList.add('card-eq-wrapper');

    const inputRow = document.createElement('div');
    inputRow.classList.add('card__input-row');

    const input = document.createElement('input');
    input.type        = 'text';
    input.placeholder = '¿Qué cónica es?';
    input.classList.add('card__name-input');
    input.autocomplete = 'off';
    input.spellcheck   = false;

    // Solo caja de texto — sin validación visual
    input.addEventListener('click', e => e.stopPropagation());
    inputRow.addEventListener('click', e => e.stopPropagation());

    inputRow.appendChild(input);

    // El wrapper contiene la carta y debajo el input
    wrapper.appendChild(el);
    wrapper.appendChild(inputRow);
    return wrapper;
  }

  return el;
}

// ── Cara de ecuación (KaTeX) ───────────────────────────────────────────────

function buildEquationFace(frontEl, card) {
  frontEl.classList.add('card__front--equation');

  const katexWrapper = document.createElement('div');
  katexWrapper.classList.add('card__katex');

  try {
    katex.render(card.conic.latex, katexWrapper, {
      throwOnError: false,
      displayMode: true,
      output: 'html',
    });
  } catch (err) {
    katexWrapper.textContent = card.conic.latex;
    console.error('[cardEngine] KaTeX render error:', err);
  }

  frontEl.appendChild(katexWrapper);
}

// ── Cara de gráfica (Canvas 2D) ────────────────────────────────────────────

function buildGraphFace(frontEl, card) {
  frontEl.classList.add('card__front--graph');

  const canvas = document.createElement('canvas');
  canvas.classList.add('card__canvas');
  // Dimensiones lógicas; render2D aplica devicePixelRatio internamente
  canvas.width  = 160;
  canvas.height = 120;

  // El canvas se renderiza cuando la carta se voltea por primera vez
  // para no bloquear el montaje inicial del tablero.
  // Guardamos la referencia al canvas en el dataset para activarlo luego.
  canvas.dataset.rendered = '0';
  canvas.dataset.conicId  = card.conic.id;

  const labelEl = document.createElement('p');
  labelEl.classList.add('card__label');
  labelEl.textContent = card.conic.label;

  frontEl.appendChild(canvas);
  frontEl.appendChild(labelEl);

  // Almacenamos referencia para renderizar desde el event listener
  frontEl._canvas = canvas;
  frontEl._conic  = card.conic;
}

// ─── 4. Renderizado diferido del canvas ───────────────────────────────────

/**
 * Activa el render2D en el canvas de una carta gráfica.
 * Se llama la primera vez que se voltea, no al montar.
 */
function ensureGraphRendered(cardEl) {
  const front  = cardEl.querySelector('.card__front--graph');
  if (!front) return;

  const canvas = front._canvas;
  if (!canvas || canvas.dataset.rendered === '1') return;

  renderConic(canvas, front._conic);
  canvas.dataset.rendered = '1';
}

// ─── 5. Event listeners ───────────────────────────────────────────────────

function attachClickListener(cardEl, card) {
  cardEl.addEventListener('click', () => {
    const state = GameState.get();

    // Guards: ignorar si bloqueado, ya emparejado, o ya volteada
    if (state.isLocked) return;
    if (state.matched.includes(card.pairId)) return;
    if (cardEl.classList.contains('is-flipped')) return;

    // Delegar a StateMachine
    StateMachine.onCardClick(card);
  });
}

// ─── 6. Suscripciones a EventBus ──────────────────────────────────────────

/**
 * Conecta los eventos del bus con las mutaciones visuales del DOM.
 * Se llama una sola vez en initBoard.
 */
function subscribeToEvents(cardElements) {
  // Mapa id → elemento DOM para acceso O(1)
  const cardMap = new Map(
    cardElements.map(el => [el.dataset.id, el])
  );

  // Voltear carta
  EventBus.on('card:flip', ({ card }) => {
    const el = cardMap.get(card.id);
    if (!el) return;

    ensureGraphRendered(el);
    el.classList.add('is-flipped');
  });

  // Par correcto
  EventBus.on('card:matched', ({ cardA, cardB }) => {
    [cardA, cardB].forEach(c => {
      const el = cardMap.get(c.id);
      if (!el) return;
      // Pequeño delay para que el flip animation termine antes del glow
      setTimeout(() => el.classList.add('is-matched'), 200);
    });
  });

  // Par incorrecto — voltear de vuelta
  EventBus.on('card:reset', ({ cardA, cardB }) => {
    [cardA, cardB].forEach(c => {
      const el = cardMap.get(c.id);
      if (!el) return;
      el.classList.add('is-wrong');
      setTimeout(() => {
        el.classList.remove('is-flipped', 'is-wrong');
      }, 600);
    });
  });

  // Sacudida en mismatch
  EventBus.on('card:mismatch', ({ cardA, cardB }) => {
    [cardA, cardB].forEach(c => {
      const el = cardMap.get(c.id);
      if (!el) return;
      el.classList.add('is-shaking');
      setTimeout(() => el.classList.remove('is-shaking'), 500);
    });
  });
}

// ─── API pública ──────────────────────────────────────────────────────────

/**
 * initBoard — Inicializa el tablero de juego.
 *
 * @param {HTMLElement} container — el elemento #game-board del HTML
 * @param {Array}       conics   — (opcional) subset de CONICS a usar; por
 *                                 defecto usa todos.
 */
export function initBoard(container, conics = CONICS) {
  // Limpiar tablero previo
  container.innerHTML = '';

  // Generar y barajar
  const rawDeck   = buildDeck(conics);
  const shuffled  = shuffle(rawDeck);

  // Persistir deck en GameState
  GameState.set({ deck: shuffled });

  // Crear elementos DOM
  const cardElements = shuffled.map(card => {
    const elOrWrapper = createCardElement(card);
    // createCardElement puede devolver el .card o un wrapper (cartas de ecuación)
    const el = elOrWrapper.classList.contains('card') ? elOrWrapper : elOrWrapper.querySelector('.card');
    attachClickListener(el, card);
    container.appendChild(elOrWrapper);
    return el;
  });

  // Suscribir a eventos del bus
  subscribeToEvents(cardElements);

  // Ajustar columnas del grid dinámicamente según cantidad de cartas
  const cols = Math.ceil(Math.sqrt(shuffled.length));
  container.style.setProperty('--board-cols', cols);

  return shuffled; // útil para tests o inicialización externa
}