/**
 * viewer.js — Visor 3D standalone para móvil.
 * Se activa cuando la URL contiene ?viewer=1
 * Lee los parámetros: type, label, a, b, r, p, orientation
 * Monta una escena Three.js a pantalla completa con ficha KaTeX.
 */

import katex           from 'katex';
import { createScene } from '../engine/render3D.js';

// Mapeo de type → label por defecto si no viene en la URL
const TYPE_LABELS = {
  circle:    'Círculo',
  ellipse:   'Elipse',
  parabola:  'Parábola',
  hyperbola: 'Hipérbola',
};

// Reconstruir latex legible desde los parámetros de la URL
function buildLatex(type, params) {
  const { a, b, r, p, orientation } = params;
  switch(type) {
    case 'circle':
      return `x^2 + y^2 = ${(r??1)**2}`;
    case 'ellipse':
      return `\\dfrac{x^2}{${(a??1)**2}} + \\dfrac{y^2}{${(b??1)**2}} = 1`;
    case 'parabola':
      return orientation === 'right' || orientation === 'left'
        ? `x = \\dfrac{y^2}{${4*(p??1)}}`
        : `y = \\dfrac{x^2}{${4*(p??1)}}`;
    case 'hyperbola':
      return orientation === 'vertical'
        ? `\\dfrac{y^2}{${(a??1)**2}} - \\dfrac{x^2}{${(b??1)**2}} = 1`
        : `\\dfrac{x^2}{${(a??1)**2}} - \\dfrac{y^2}{${(b??1)**2}} = 1`;
    default:
      return '';
  }
}

export function startViewer(urlParams) {
  // Leer parámetros
  const type        = urlParams.get('type')        ?? 'ellipse';
  const label       = urlParams.get('label')        ?? TYPE_LABELS[type] ?? 'Superficie';
  const a           = parseFloat(urlParams.get('a')) || 3;
  const b           = parseFloat(urlParams.get('b')) || 4;
  const r           = parseFloat(urlParams.get('r')) || 3;
  const p           = parseFloat(urlParams.get('p')) || 2;
  const orientation = urlParams.get('orientation')  ?? 'horizontal';

  const params = { a, b, r, p, orientation };
  const latex  = buildLatex(type, params);
  const conic  = { type, label, params, latex };

  // Ocultar todo el HTML del juego
  document.body.innerHTML = '';
  document.body.style.cssText = `
    margin:0; padding:0; background:#08050f;
    min-height:100dvh; display:flex; flex-direction:column;
    font-family:'Inter',system-ui,sans-serif; color:#f0ecff;
    overflow:hidden;
  `;

  // ── Header ──────────────────────────────────────────────
  const header = document.createElement('div');
  header.style.cssText = `
    padding: 16px 20px 10px;
    display: flex; flex-direction: column; gap: 8px;
    background: rgba(8,5,15,0.85);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(255,255,255,0.07);
  `;

  const badge = document.createElement('span');
  badge.textContent = 'MULTIVAR · Visor 3D';
  badge.style.cssText = `
    font-size: 0.6rem; font-weight: 700; letter-spacing: 0.12em;
    text-transform: uppercase; color: #7c5cfc;
    background: rgba(124,92,252,0.12);
    border: 1px solid rgba(124,92,252,0.3);
    padding: 3px 10px; border-radius: 999px;
    width: fit-content;
  `;

  const titleEl = document.createElement('h1');
  titleEl.textContent = label;
  titleEl.style.cssText = `
    font-size: clamp(1.3rem, 5vw, 1.8rem);
    font-weight: 800; margin: 0; line-height: 1.1;
    background: linear-gradient(90deg, #7c5cfc, #00e5ff);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  `;

  // Ecuación KaTeX
  const eqEl = document.createElement('div');
  eqEl.style.cssText = `font-size: clamp(0.9rem, 3.5vw, 1.2rem); color: #e8e0ff;`;
  if (latex) {
    try {
      katex.render(latex, eqEl, { throwOnError: false, displayMode: true, output: 'html' });
    } catch {
      eqEl.textContent = latex;
    }
  }

  header.appendChild(badge);
  header.appendChild(titleEl);
  if (latex) header.appendChild(eqEl);
  document.body.appendChild(header);

  // ── Canvas 3D ────────────────────────────────────────────
  const canvasWrap = document.createElement('div');
  canvasWrap.style.cssText = `
    flex: 1; position: relative;
    background: radial-gradient(ellipse at center, #0d0a1e, #06040f);
    min-height: 0;
  `;

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'display:block; width:100%; height:100%;';
  canvasWrap.appendChild(canvas);

  const hint = document.createElement('p');
  hint.textContent = 'Arrastra para rotar · Pellizca para zoom';
  hint.style.cssText = `
    position: absolute; bottom: 12px; left: 50%;
    transform: translateX(-50%);
    font-size: 0.65rem; color: rgba(255,255,255,0.25);
    letter-spacing: 0.05em; white-space: nowrap;
    pointer-events: none;
  `;
  canvasWrap.appendChild(hint);
  document.body.appendChild(canvasWrap);

  // ── Pie con botón de volver ──────────────────────────────
  const footer = document.createElement('div');
  footer.style.cssText = `
    padding: 12px 20px;
    display: flex; justify-content: center;
    background: rgba(8,5,15,0.7);
    border-top: 1px solid rgba(255,255,255,0.06);
  `;

  const backBtn = document.createElement('a');
  backBtn.href = '/';
  backBtn.textContent = '← Ir al juego';
  backBtn.style.cssText = `
    font-size: 0.8rem; font-weight: 700; color: #7c5cfc;
    text-decoration: none; letter-spacing: 0.04em;
    padding: 8px 20px;
    border: 1px solid rgba(124,92,252,0.4);
    border-radius: 999px;
    background: rgba(124,92,252,0.1);
    transition: background 0.2s;
  `;
  footer.appendChild(backBtn);
  document.body.appendChild(footer);

  // ── Iniciar Three.js tras layout ─────────────────────────
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const w = canvasWrap.clientWidth  || window.innerWidth;
    const h = canvasWrap.clientHeight || window.innerHeight * 0.6;
    canvas.width  = w;
    canvas.height = h;

    try {
      createScene(canvas, conic, { mini: false, autoRotateSpeed: 0.6 });
    } catch(err) {
      console.error('[viewer] createScene falló:', err);
      canvasWrap.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;
                    height:100%;flex-direction:column;gap:12px;color:rgba(255,255,255,0.4);">
          <span style="font-size:3rem">⬡</span>
          <span style="font-size:0.85rem">WebGL no disponible en este dispositivo</span>
        </div>`;
    }

    // Resize al rotar el móvil
    window.addEventListener('resize', () => {
      canvas.width  = canvasWrap.clientWidth;
      canvas.height = canvasWrap.clientHeight;
    });
  }));
}