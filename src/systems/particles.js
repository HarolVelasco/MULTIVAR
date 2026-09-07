/**
 * particles.js — Sistema de partículas 2D overlay sobre el tablero.
 *
 * Crea un <canvas> overlay encima del tablero y dibuja explosiones
 * de chispas neón en las coordenadas exactas de las cartas al hacer match.
 *
 * API pública:
 *   ParticleSystem.init()             — monta el canvas overlay
 *   ParticleSystem.burst(x, y, color) — dispara una explosión en (x, y)
 *   ParticleSystem.bindEvents()       — conecta con EventBus
 */

import EventBus from '../core/eventBus.js';

const ParticleSystem = (() => {
  let canvas, ctx, animId;
  let particles = [];
  let running   = false;

  // ─── Colores por tipo de carta ────────────────────────────
  const COLORS = {
    equation: ['#7c5cfc', '#a78bfa', '#c4b5fd', '#ffffff'],
    graph:    ['#00e5ff', '#67e8f9', '#a5f3fc', '#ffffff'],
    combo:    ['#ffd166', '#fb923c', '#f472b6', '#ffffff'],
  };

  // ─── Clase Partícula ──────────────────────────────────────
  class Particle {
    constructor(x, y, color) {
      this.x    = x;
      this.y    = y;
      this.vx   = (Math.random() - 0.5) * 7;
      this.vy   = (Math.random() - 0.8) * 8;   // sesgo hacia arriba
      this.life = 1;                             // 0-1, decrece
      this.decay = 0.022 + Math.random() * 0.02;
      this.size  = 2.5 + Math.random() * 3.5;
      this.color = color;
      this.gravity = 0.18;
      // Forma: 0=círculo, 1=estrella, 2=cuadrado
      this.shape = Math.floor(Math.random() * 3);
    }

    update() {
      this.vy  += this.gravity;
      this.x   += this.vx;
      this.y   += this.vy;
      this.life -= this.decay;
      this.size *= 0.97;
      this.vx  *= 0.98;
    }

    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.life);
      ctx.fillStyle   = this.color;
      ctx.shadowBlur  = 8;
      ctx.shadowColor = this.color;
      ctx.translate(this.x, this.y);

      if (this.shape === 0) {
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (this.shape === 1) {
        // Diamante
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
      } else {
        // Cruz / chispa
        ctx.fillRect(-this.size / 2, -1, this.size, 2);
        ctx.fillRect(-1, -this.size / 2, 2, this.size);
      }

      ctx.restore();
    }

    get dead() { return this.life <= 0 || this.size < 0.3; }
  }

  // ─── Loop de animación ────────────────────────────────────

  function loop() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles = particles.filter(p => !p.dead);
    particles.forEach(p => { p.update(); p.draw(ctx); });

    if (particles.length > 0) {
      animId = requestAnimationFrame(loop);
    } else {
      running = false;
      animId  = null;
    }
  }

  // ─── Crear explosión ──────────────────────────────────────

  function burst(x, y, palette = COLORS.graph, count = 28) {
    for (let i = 0; i < count; i++) {
      const color = palette[Math.floor(Math.random() * palette.length)];
      particles.push(new Particle(x, y, color));
    }
    if (!running) {
      running = true;
      loop();
    }
  }

  // ─── Obtener coords del centro de una carta ───────────────

  function getCardCenter(cardEl) {
    const rect       = cardEl.getBoundingClientRect();
    const overlayRect = canvas.getBoundingClientRect();
    return {
      x: rect.left + rect.width  / 2 - overlayRect.left,
      y: rect.top  + rect.height / 2 - overlayRect.top,
    };
  }

  // ─── API pública ──────────────────────────────────────────

  return {
    init() {
      // Crear canvas overlay sobre el tablero
      canvas = document.createElement('canvas');
      canvas.id = 'particle-overlay';
      canvas.style.cssText = `
        position: fixed;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 50;
      `;
      document.body.appendChild(canvas);

      ctx = canvas.getContext('2d');

      // Ajustar resolución al viewport
      function resize() {
        canvas.width  = window.innerWidth  * (window.devicePixelRatio || 1);
        canvas.height = window.innerHeight * (window.devicePixelRatio || 1);
        canvas.style.width  = window.innerWidth  + 'px';
        canvas.style.height = window.innerHeight + 'px';
        ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
      }
      resize();
      window.addEventListener('resize', resize);
    },

    burst(x, y, type = 'graph') {
      const palette = COLORS[type] ?? COLORS.graph;
      burst(x, y, palette);
    },

    burstAt(cardEl, type = 'graph') {
      if (!canvas) return;
      const { x, y } = getCardCenter(cardEl);
      this.burst(x, y, type);
    },

    bindEvents() {
      EventBus.on('card:matched', ({ cardA, cardB, combo }) => {
        const elA = document.querySelector(`[data-id="${cardA.id}"]`);
        const elB = document.querySelector(`[data-id="${cardB.id}"]`);

        const type    = combo >= 3 ? 'combo' : 'graph';
        const count   = combo >= 2 ? 38 : 26;

        if (elA) {
          const { x, y } = getCardCenter(elA);
          burst(x, y, COLORS[type], count);
        }
        if (elB) {
          const { x, y } = getCardCenter(elB);
          burst(x, y, COLORS[type], count);
        }
      });
    },
  };
})();

export default ParticleSystem;