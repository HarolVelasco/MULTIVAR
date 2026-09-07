/**
 * audioSystem.js — Motor de efectos de sonido con Web Audio API pura.
 * Sin archivos MP3. Todos los sonidos se sintetizan en tiempo real.
 *
 * API pública:
 *   AudioSystem.init()        — crea el AudioContext (llamar tras gesto de usuario)
 *   AudioSystem.play(name)    — reproduce un efecto por nombre
 *   AudioSystem.setVolume(v)  — volumen global 0-1
 *   AudioSystem.toggle()      — mute/unmute; devuelve nuevo estado muted (bool)
 */

import EventBus from '../core/eventBus.js';

const AudioSystem = (() => {
  let ctx    = null;
  let master = null;
  let muted  = false;
  let ready  = false;

  // ─── Inicializar AudioContext ─────────────────────────────
  function init() {
    if (ready) return;
    try {
      ctx    = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.55;
      master.connect(ctx.destination);
      ready  = true;
    } catch (e) {
      console.warn('[AudioSystem] Web Audio API no disponible:', e);
    }
  }

  // ─── Helpers de síntesis ──────────────────────────────────

  function osc(type, freq, startTime, duration, gainVal = 0.3) {
    if (!ready) return;
    const g = ctx.createGain();
    const o = ctx.createOscillator();
    o.type  = type;
    o.frequency.setValueAtTime(freq, startTime);
    g.gain.setValueAtTime(gainVal, startTime);
    g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    o.connect(g); g.connect(master);
    o.start(startTime); o.stop(startTime + duration + 0.01);
  }

  function sweep(type, freqFrom, freqTo, startTime, duration, gainVal = 0.25) {
    if (!ready) return;
    const g = ctx.createGain();
    const o = ctx.createOscillator();
    o.type  = type;
    o.frequency.setValueAtTime(freqFrom, startTime);
    o.frequency.exponentialRampToValueAtTime(freqTo, startTime + duration);
    g.gain.setValueAtTime(gainVal, startTime);
    g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    o.connect(g); g.connect(master);
    o.start(startTime); o.stop(startTime + duration + 0.01);
  }

  function noise(startTime, duration, gainVal = 0.15) {
    if (!ready) return;
    const bufSize = Math.ceil(ctx.sampleRate * duration);
    const buf     = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data    = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

    const src  = ctx.createBufferSource();
    src.buffer = buf;

    const filt       = ctx.createBiquadFilter();
    filt.type        = 'bandpass';
    filt.frequency.value = 2200;
    filt.Q.value     = 1.5;

    const g = ctx.createGain();
    g.gain.setValueAtTime(gainVal, startTime);
    g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    src.connect(filt); filt.connect(g); g.connect(master);
    src.start(startTime); src.stop(startTime + duration + 0.01);
  }

  // ─── Efectos ──────────────────────────────────────────────

  const EFFECTS = {
    flip() {
      const t = ctx.currentTime;
      sweep('sine', 320, 480, t, 0.1, 0.18);
      noise(t, 0.04, 0.08);
    },

    match() {
      const t = ctx.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        osc('sine',     freq,      t + i * 0.08, 0.35, 0.22);
        osc('triangle', freq * 2,  t + i * 0.08, 0.20, 0.06);
      });
    },

    error() {
      const t = ctx.currentTime;
      sweep('sawtooth', 280, 140, t, 0.28, 0.2);
      osc('square', 110, t + 0.05, 0.18, 0.08);
    },

    combo() {
      const t = ctx.currentTime;
      [880, 1108, 1320, 1760].forEach((freq, i) => {
        osc('sine',     freq,       t + i * 0.055, 0.22, 0.20);
        osc('triangle', freq * 1.5, t + i * 0.055, 0.12, 0.06);
      });
    },

    powerup() {
      const t = ctx.currentTime;
      sweep('sine',     400, 1600, t,        0.4,  0.28);
      sweep('triangle', 600, 2400, t + 0.05, 0.35, 0.12);
      noise(t + 0.1, 0.15, 0.1);
    },

    victory() {
      const t = ctx.currentTime;
      const melody = [
        { f: 523, d: 0.15 }, { f: 659, d: 0.15 },
        { f: 784, d: 0.15 }, { f: 1047, d: 0.40 },
        { f: 880, d: 0.15 }, { f: 1047, d: 0.50 },
      ];
      let time = t;
      melody.forEach(({ f, d }) => {
        osc('sine',     f,     time, d + 0.1, 0.22);
        osc('triangle', f * 2, time, d,       0.06);
        time += d;
      });
      [523, 659, 784, 1047].forEach(f => osc('sine', f, time, 0.8, 0.15));
    },
  };

  // ─── Suscripciones al EventBus ────────────────────────────

  function bindEvents() {
    EventBus.on('card:flip',    () => AudioSystem.play('flip'));
    EventBus.on('card:matched', ({ combo }) => {
      AudioSystem.play('match');
      if (combo >= 2) setTimeout(() => AudioSystem.play('combo'), 180);
    });
    EventBus.on('card:mismatch', () => AudioSystem.play('error'));
    EventBus.on('powerup:used',  () => AudioSystem.play('powerup'));
    EventBus.on('game:win',      () => setTimeout(() => AudioSystem.play('victory'), 300));
  }

  // ─── API pública ──────────────────────────────────────────

  return {
    init() { init(); bindEvents(); },

    play(name) {
      if (!ready || muted) return;
      if (ctx.state === 'suspended') ctx.resume();
      const fn = EFFECTS[name];
      if (fn) fn();
      else console.warn(`[AudioSystem] Efecto desconocido: "${name}"`);
    },

    setVolume(v) {
      if (!ready) return;
      master.gain.setTargetAtTime(Math.max(0, Math.min(1, v)), ctx.currentTime, 0.05);
    },

    toggle() {
      muted = !muted;
      if (ready) master.gain.setTargetAtTime(muted ? 0 : 0.55, ctx.currentTime, 0.05);
      return muted;
    },

    get isMuted() { return muted; },
  };
})();

export default AudioSystem;