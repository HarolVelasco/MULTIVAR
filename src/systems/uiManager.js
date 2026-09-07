/**
 * uiManager.js — Actualiza el DOM del HUD y pantallas.
 * Usa lazy-query: los elementos se buscan cuando se necesitan,
 * no en init(), para evitar errores si están en contenedores hidden.
 */

import EventBus  from '../core/eventBus.js';
import GameState from '../core/gameState.js';

const UIManager = (() => {

  // Lazy-query: busca el elemento cuando se necesita, sin warning
  const $ = id => document.getElementById(id);

  // ── Helpers ──────────────────────────────────────────────

  function bump(el, cls='hud__value--bump'){
    if(!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    el.addEventListener('animationend',()=>el.classList.remove(cls),{once:true});
  }

  function formatTime(s){
    const m=String(Math.floor(s/60)).padStart(2,'0');
    const sec=String(s%60).padStart(2,'0');
    return `${m}:${sec}`;
  }

  function applyTimerColor(timeLeft){
    const el=$('hud-timer'); if(!el) return;
    el.classList.remove('timer--warning','timer--danger');
    if(timeLeft<=10) el.classList.add('timer--danger');
    else if(timeLeft<=30) el.classList.add('timer--warning');
  }

  // ── Handlers ─────────────────────────────────────────────

  function onTimerTick({timeLeft}){
    const el=$('hud-timer'); if(!el) return;
    el.textContent=formatTime(timeLeft);
    applyTimerColor(timeLeft);
  }

  function onTimerExpired(){ showGameOver(); }

  function onScoreUpdated({score,combo,points}){
    const sc=$('hud-score');
    if(sc){ sc.textContent=score; if(points>0) bump(sc); }
    const cb=$('hud-combo');
    if(cb){
      if(combo>1){ cb.textContent=`×${combo}`; cb.classList.add('hud__combo--active'); bump(cb); }
      else{ cb.textContent=''; cb.classList.remove('hud__combo--active'); }
    }
  }

  function onCardMatched(){
    const el=$('hud-pairs'); if(!el) return;
    const {matched,deck}=GameState.get();
    el.textContent=`${matched.length} / ${deck.length/2}`;
    bump(el);
  }

  function onScoreBonus({bonus,finalScore}){
    const sc=$('hud-score'); if(sc) sc.textContent=finalScore;
    const bm=$('hud-bonus-msg');
    if(bm){
      bm.textContent=`+${bonus} pts bonus de tiempo`;
      bm.classList.remove('hidden');
      setTimeout(()=>bm.classList.add('hidden'),2500);
    }
  }

  function onGameWin(){
    const {score}=GameState.get();
    const ws=$('win-screen'); if(ws) ws.classList.remove('hidden');
    const wsc=$('win-score'); if(wsc) wsc.textContent=score;
    const gos=$('gameover-screen'); if(gos) gos.classList.add('hidden');
  }

  function showGameOver(){
    const gos=$('gameover-screen'); if(!gos) return;
    const {score}=GameState.get();
    gos.classList.remove('hidden');
    const gosc=$('gameover-score'); if(gosc) gosc.textContent=score;
    const ws=$('win-screen'); if(ws) ws.classList.add('hidden');
  }

  function hideScreens(){
    [$('win-screen'),$('gameover-screen'),$('hud-bonus-msg')].forEach(el=>{
      el?.classList.add('hidden');
    });
  }

  // ── API pública ───────────────────────────────────────────

  return {
    init(){
      EventBus.on('timer:tick',    onTimerTick);
      EventBus.on('timer:expired', onTimerExpired);
      EventBus.on('score:updated', onScoreUpdated);
      EventBus.on('score:bonus',   onScoreBonus);
      EventBus.on('card:matched',  onCardMatched);
      EventBus.on('game:win',      onGameWin);
    },

    reset(){
      hideScreens();
      const totalPairs=GameState.get().deck.length/2||8;
      const t=$('hud-timer');  if(t)  t.textContent=formatTime(90);
      const s=$('hud-score');  if(s)  s.textContent='0';
      const c=$('hud-combo');  if(c){ c.textContent=''; c.classList.remove('hud__combo--active'); }
      const p=$('hud-pairs');  if(p)  p.textContent=`0 / ${totalPairs}`;
      applyTimerColor(90);
    },
  };
})();

export default UIManager;