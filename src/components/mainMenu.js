/**
 * mainMenu.js — Hub principal de MULTIVAR.
 *
 * Flujo:
 *   Hub (selector de modo) → Menú de juego específico → Partida
 *
 * Pantallas gestionadas:
 *   #screen-hub     — selección entre CalcMatch y Desafío Cónico 3D
 *   #screen-menu    — configuración de CalcMatch (dificultad, modo)
 *   #screen-pause   — pausa
 *   #screen-results — estadísticas post-partida
 *
 * API pública:
 *   MainMenu.init(callbacks)
 *   MainMenu.showHub()
 *   MainMenu.showMenu()
 *   MainMenu.showPause()
 *   MainMenu.hidePause()
 *   MainMenu.showResults(stats)
 *   MainMenu.selection  → { difficulty, mode }
 */

export const DIFFICULTY_CONFIG = {
  easy:   { label: 'Fácil',   cols: 3, pairs: 4,  time: 300, grid: '3×4' },
  normal: { label: 'Normal',  cols: 4, pairs: 8,  time: 180, grid: '4×4' },
};

const MainMenu = (() => {
  let callbacks = {};
  let selection = { difficulty: 'normal', mode: 'arcade' };

  // ─── Helpers de pantalla ──────────────────────────────────

  const ALL_SCREENS = ['screen-hub', 'screen-menu', 'screen-pause', 'screen-results'];

  function hideAll() {
    ALL_SCREENS.forEach(id => document.getElementById(id)?.classList.add('hidden'));
  }

  function show(id) {
    hideAll();
    document.getElementById(id)?.classList.remove('hidden');
  }

  // ══════════════════════════════════════════════════════════
  //  HUB — Selector de modo de juego
  // ══════════════════════════════════════════════════════════

  function showHub() {
    show('screen-hub');
    const el = document.getElementById('screen-hub');
    if (!el) return;

    el.innerHTML = `
      <div class="hub__wrapper">

        <div class="hub__header">
          <h1 class="hub__logo">MULTI<span>VAR</span></h1>
          <p class="hub__subtitle">Portal Académico · Cálculo Multivariable</p>
        </div>

        <div class="hub__modes">

          <!-- Modo 1: CalcMatch -->
          <button class="hub__mode-card" id="hub-btn-calcmatch">
            <div class="hub__mode-icon">◈</div>
            <div class="hub__mode-body">
              <h2 class="hub__mode-title">CalcMatch</h2>
              <p class="hub__mode-sub">Memoria Neón</p>
              <p class="hub__mode-desc">
                Empareja ecuaciones con sus gráficas. Combos, temporizador y visor 3D interactivo.
              </p>
            </div>
            <span class="hub__mode-arrow">→</span>
          </button>

          <!-- Modo 2: Desafío Cónico 3D -->
          <button class="hub__mode-card hub__mode-card--quiz" id="hub-btn-quiz">
            <div class="hub__mode-icon">⬡</div>
            <div class="hub__mode-body">
              <h2 class="hub__mode-title">Desafío Cónico 3D</h2>
              <p class="hub__mode-sub">Quiz por Niveles</p>
              <p class="hub__mode-desc">
                Identifica la superficie 3D correcta a partir de su ecuación. Ficha técnica y QR incluidos.
              </p>
            </div>
            <span class="hub__mode-arrow">→</span>
          </button>

        </div>

        <p class="hub__footer">Selecciona un modo para comenzar</p>
      </div>
    `;

    el.querySelector('#hub-btn-calcmatch')?.addEventListener('click', () => {
      show('screen-menu');
      renderCalcMatchMenu();
    });

    el.querySelector('#hub-btn-quiz')?.addEventListener('click', () => {
      hideAll();
      callbacks.onStartQuiz?.();
    });
  }

  // ══════════════════════════════════════════════════════════
  //  MENÚ CALCMATCH
  // ══════════════════════════════════════════════════════════

  function showMenu() {
    show('screen-menu');
    renderCalcMatchMenu();
  }

  function renderCalcMatchMenu() {
    const el = document.getElementById('screen-menu');
    if (!el) return;

    el.innerHTML = `
      <div class="menu__card">

        <button class="menu__back-btn" id="btn-back-hub">← Modos</button>

        <div class="menu__logo">
          <span class="menu__logo-text">Calc<span>Match</span></span>
          <p class="menu__tagline">Memory · Cónicas 2D/3D</p>
        </div>

        <div class="menu__section">
          <p class="menu__section-label">Dificultad</p>
          <div class="menu__options" id="diff-options">
            ${Object.entries(DIFFICULTY_CONFIG).map(([key, cfg]) => `
              <button
                class="menu__opt-btn ${key === selection.difficulty ? 'is-active' : ''}"
                data-diff="${key}"
              >
                <span class="menu__opt-title">${cfg.label}</span>
                <span class="menu__opt-sub">${cfg.grid} · ${cfg.time}s</span>
              </button>
            `).join('')}
          </div>
        </div>

        <div class="menu__section">
          <p class="menu__section-label">Modo de juego</p>
          <div class="menu__options">
            <button class="menu__opt-btn ${selection.mode === 'arcade' ? 'is-active' : ''}" data-mode="arcade">
              <span class="menu__opt-title">⚡ Arcade</span>
              <span class="menu__opt-sub">Temporizador · Combos</span>
            </button>
            <button class="menu__opt-btn ${selection.mode === 'zen' ? 'is-active' : ''}" data-mode="zen">
              <span class="menu__opt-title">🧘 Zen</span>
              <span class="menu__opt-sub">Sin tiempo · Aprendizaje libre</span>
            </button>
          </div>
        </div>

        <button class="menu__start-btn" id="btn-start-game">Iniciar partida →</button>
      </div>
    `;

    // Volver al hub
    el.querySelector('#btn-back-hub')?.addEventListener('click', showHub);

    // Dificultad
    el.querySelectorAll('[data-diff]').forEach(btn => {
      btn.addEventListener('click', () => {
        selection.difficulty = btn.dataset.diff;
        el.querySelectorAll('[data-diff]').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
      });
    });

    // Modo
    el.querySelectorAll('[data-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        selection.mode = btn.dataset.mode;
        el.querySelectorAll('[data-mode]').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
      });
    });

    // Iniciar
    el.querySelector('#btn-start-game')?.addEventListener('click', () => {
      hideAll();
      callbacks.onStart?.(selection);
    });
  }

  // ══════════════════════════════════════════════════════════
  //  PAUSA
  // ══════════════════════════════════════════════════════════

  function showPause() {
    const el = document.getElementById('screen-pause');
    if (!el) return;
    el.classList.remove('hidden');
    el.innerHTML = `
      <div class="overlay__card">
        <h2 class="overlay__title" style="font-size:2rem">Pausa</h2>
        <button class="overlay__btn" id="btn-resume">Continuar</button>
        <button class="overlay__btn" id="btn-quit-hub" style="opacity:0.6;margin-top:0.25rem">
          Menú principal
        </button>
      </div>
    `;
    el.querySelector('#btn-resume')?.addEventListener('click', () => {
      el.classList.add('hidden');
      callbacks.onResume?.();
    });
    el.querySelector('#btn-quit-hub')?.addEventListener('click', () => {
      el.classList.add('hidden');
      document.getElementById('game-area')?.classList.add('hidden');
      showHub();
    });
  }

  function hidePause() {
    document.getElementById('screen-pause')?.classList.add('hidden');
  }

  // ══════════════════════════════════════════════════════════
  //  RESULTADOS
  // ══════════════════════════════════════════════════════════

  function showResults(stats) {
    show('screen-results');
    const el = document.getElementById('screen-results');
    if (!el) return;

    const rank = calcRank(stats);

    el.innerHTML = `
      <div class="overlay__card results__card">
        <div class="results__rank results__rank--${rank.toLowerCase().replace('+','plus')}">${rank}</div>
        <h2 class="overlay__title overlay__title--win" style="font-size:1.8rem">Partida completada</h2>

        <div class="results__grid">
          <div class="results__stat">
            <span class="results__stat-label">Puntaje</span>
            <span class="results__stat-value">${stats.score.toLocaleString()}</span>
          </div>
          <div class="results__stat">
            <span class="results__stat-label">Precisión</span>
            <span class="results__stat-value">${stats.accuracy}%</span>
          </div>
          <div class="results__stat">
            <span class="results__stat-label">Combo máx.</span>
            <span class="results__stat-value">×${stats.maxCombo}</span>
          </div>
          <div class="results__stat">
            <span class="results__stat-label">APM</span>
            <span class="results__stat-value">${stats.apm}</span>
          </div>
          <div class="results__stat">
            <span class="results__stat-label">Tiempo</span>
            <span class="results__stat-value">${Number(stats.timeUsed).toFixed(1)}s</span>
          </div>
          <div class="results__stat">
            <span class="results__stat-label">Pares</span>
            <span class="results__stat-value">${stats.pairs}</span>
          </div>
        </div>

        <div class="results__actions">
          <button class="overlay__btn" id="btn-play-again">Jugar de nuevo</button>
          <button class="overlay__btn" id="btn-go-hub" style="opacity:0.65">Menú principal</button>
        </div>
      </div>
    `;

    el.querySelector('#btn-play-again')?.addEventListener('click', () => {
      hideAll();
      callbacks.onRestart?.();
    });
    el.querySelector('#btn-go-hub')?.addEventListener('click', () => {
      hideAll();
      showHub();
    });
  }

  // ─── Helpers ──────────────────────────────────────────────

  function calcRank({ accuracy, maxCombo, score }) {
    if (accuracy >= 90 && maxCombo >= 4 && score >= 1200) return 'A+';
    if (accuracy >= 75 && maxCombo >= 2 && score >= 600)  return 'A';
    if (accuracy >= 60)                                    return 'B';
    return 'C';
  }

  function bindKeyboard() {
    document.addEventListener('keydown', e => {
      if (e.key !== 'p' && e.key !== 'P') return;
      const paused = !document.getElementById('screen-pause')?.classList.contains('hidden');
      if (paused) { hidePause(); callbacks.onResume?.(); }
      else        { showPause(); callbacks.onPause?.(); }
    });
  }

  // ─── API pública ──────────────────────────────────────────

  return {
    get selection() { return { ...selection }; },

    init(cbs = {}) {
      callbacks = cbs;
      bindKeyboard();
    },

    showHub,
    showMenu,
    showPause,
    hidePause,
    showResults,
  };
})();

export default MainMenu;