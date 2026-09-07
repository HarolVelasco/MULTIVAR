/**
 * main.js — Punto de entrada de MULTIVAR.
 *
 * Flujo:
 *   Hub → CalcMatch (Memoria) | Desafío Cónico 3D (Quiz)
 */

import 'katex/dist/katex.min.css';
import './styles/main.css';

import { initBoard }                   from './engine/cardEngine.js';
import { CONICS }                      from './data/conics.js';
import GameState                       from './core/gameState.js';
import EventBus                        from './core/eventBus.js';
import TimerSystem                     from './systems/timerSystem.js';
import ScoreSystem                     from './systems/scoreSystem.js';
import UIManager                       from './systems/uiManager.js';
import AudioSystem                     from './systems/audioSystem.js';
import ParticleSystem                  from './systems/particles.js';
import PowerUps                        from './systems/powerUps.js';
import Modal                           from './components/modal.js';
import MainMenu, { DIFFICULTY_CONFIG } from './components/mainMenu.js';
import QuizMode                        from './components/quizMode.js';

// ─── Elementos DOM raíz ───────────────────────────────────
const boardEl    = document.getElementById('game-board');
const gameArea   = document.getElementById('game-area');
const quizArea   = document.getElementById('quiz-area');

// ─── Estadísticas de sesión ───────────────────────────────
let sessionStats = { actions: 0, errors: 0, maxCombo: 0, startTime: null };

// ══════════════════════════════════════════════════════════
//  ARRANQUE
// ══════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  // Sistemas que solo suscriben al EventBus
  UIManager.init();
  ScoreSystem.init();
  Modal.init();
  ParticleSystem.init();
  ParticleSystem.bindEvents();

  // Audio se activa en el primer gesto del usuario
  document.addEventListener('click', () => AudioSystem.init(), { once: true });

  // Menú principal
  MainMenu.init({
    onStart:      startCalcMatch,
    onResume:     resumeGame,
    onRestart:    () => startCalcMatch(MainMenu.selection),
    onPause:      pauseGame,
    onStartQuiz:  startQuizMode,
  });

  // Botones de pausa y reinicio del HUD
  document.getElementById('btn-pause')?.addEventListener('click', pauseGame);
  document.querySelectorAll('.btn-restart').forEach(btn =>
    btn.addEventListener('click', () => startCalcMatch(MainMenu.selection))
  );

  // Eventos para estadísticas
  EventBus.on('card:flip',     ()          => sessionStats.actions++);
  EventBus.on('card:mismatch', ()          => sessionStats.errors++);
  EventBus.on('card:matched',  ({ combo }) => {
    sessionStats.actions++;
    if (combo > sessionStats.maxCombo) sessionStats.maxCombo = combo;
  });
  EventBus.on('game:win',      onGameWin);
  EventBus.on('timer:expired', onGameOver);

  // Iniciar QuizMode apuntando al contenedor reservado
  if (quizArea) {
    QuizMode.init(quizArea, () => {
      quizArea.classList.add('hidden');
      quizArea.innerHTML = '';
      MainMenu.showHub();
    });
  }

  // Mostrar hub al arrancar
  MainMenu.showHub();
});

// ══════════════════════════════════════════════════════════
//  CALCMATCH
// ══════════════════════════════════════════════════════════

function startCalcMatch(sel = { difficulty: 'normal', mode: 'arcade' }) {
  const cfg = DIFFICULTY_CONFIG[sel.difficulty] ?? DIFFICULTY_CONFIG.normal;

  // Ocultar quiz si estaba activo
  quizArea?.classList.add('hidden');

  GameState.reset();
  ScoreSystem.reset();
  sessionStats = { actions: 0, errors: 0, maxCombo: 0, startTime: Date.now() };

  const conicSubset = CONICS.slice(0, cfg.pairs);

  if (boardEl) {
    boardEl.style.setProperty('--board-cols', cfg.cols);
    initBoard(boardEl, conicSubset);
  }

  gameArea?.classList.remove('hidden');
  UIManager.reset();
  PowerUps.reset();
  PowerUps.init(TimerSystem);

  TimerSystem.reset();
  const timerParent = document.getElementById('hud-timer')?.parentElement;

  if (sel.mode === 'arcade') {
    TimerSystem.start(cfg.time);
    timerParent?.classList.remove('hidden');
  } else {
    // Modo Zen: sin presión de tiempo
    timerParent?.classList.add('hidden');
  }
}

function pauseGame() {
  TimerSystem.stop();
  MainMenu.showPause();
}

function resumeGame() {
  TimerSystem.start(GameState.get().timeLeft);
}

function onGameWin({ score }) {
  TimerSystem.stop();
  AudioSystem.play('victory');
  const stats = buildStats(score);
  setTimeout(() => {
    gameArea?.classList.add('hidden');
    MainMenu.showResults(stats);
  }, 900);
}

function onGameOver() {
  const { score } = GameState.get();
  const stats = buildStats(score);
  setTimeout(() => {
    gameArea?.classList.add('hidden');
    document.getElementById('gameover-screen')?.classList.add('hidden');
    MainMenu.showResults(stats);
  }, 600);
}

function buildStats(score) {
  const { matched, deck } = GameState.get();
  const timeUsed  = (Date.now() - (sessionStats.startTime ?? Date.now())) / 1000;
  const totalActs = sessionStats.actions;
  const errors    = sessionStats.errors;
  const hits      = totalActs - errors;
  const accuracy  = totalActs > 0 ? Math.round((hits / totalActs) * 100) : 0;
  const apm       = timeUsed > 0 ? Math.round((totalActs / timeUsed) * 60) : 0;
  return { score, accuracy, maxCombo: sessionStats.maxCombo, apm, pairs: matched.length, timeUsed };
}

// ══════════════════════════════════════════════════════════
//  QUIZ MODE
// ══════════════════════════════════════════════════════════

function startQuizMode() {
  gameArea?.classList.add('hidden');

  if (!quizArea) {
    console.error('[main] No se encontró #quiz-area en el HTML.');
    return;
  }

  quizArea.classList.remove('hidden');
  QuizMode.start();
}