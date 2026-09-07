/**
 * modal.js — Visor 3D + Ficha matemática técnica + QR.
 *
 * Al completar una pareja:
 *   1. Abre el modal con la ficha KaTeX de la cónica.
 *   2. Carga render3D.js dinámicamente e inicia la escena.
 *   3. Genera un QR apuntando a un visor 3D standalone.
 *
 * API pública:
 *   Modal.init() — registra listeners (llamar una vez en main.js)
 */

import EventBus from '../core/eventBus.js';
import katex    from 'katex';

const modalEl    = () => document.getElementById('modal-3d');
const canvasEl   = () => document.getElementById('modal-canvas');
const closeBtn   = () => document.getElementById('close-modal');
const titleEl    = () => document.getElementById('modal-title');
const descEl     = () => document.getElementById('modal-desc');
const sheetEl    = () => document.getElementById('modal-mathsheet');
const qrEl       = () => document.getElementById('modal-qr');

let render3DModule = null;

// ══════════════════════════════════════════════════════════
//  FICHA MATEMÁTICA
// ══════════════════════════════════════════════════════════

/**
 * Genera el HTML con la ficha KaTeX según el tipo de cónica.
 * Devuelve un array de { label, latex } para renderizar en tabla.
 */
function buildMathSheet(conic) {
  const { type, params, latex } = conic;
  const rows = [];

  rows.push({ label: 'Ecuación canónica', latex });

  switch (type) {

    case 'circle': {
      const { r } = params;
      rows.push({ label: 'Ecuación general', latex: `x^2 + y^2 - ${r*r} = 0` });
      rows.push({ label: 'Centro', latex: '(0,\\, 0)' });
      rows.push({ label: 'Radio', latex: `r = ${r}` });
      rows.push({ label: 'Excentricidad', latex: 'e = 0' });
      break;
    }

    case 'ellipse': {
      const { a, b } = params;
      const a2 = a * a, b2 = b * b;
      const isMajorX = a > b;
      const cVal = Math.sqrt(Math.abs(a2 - b2)).toFixed(3);
      const eVal = (parseFloat(cVal) / Math.max(a, b)).toFixed(3);

      rows.push({ label: 'Ecuación general', latex: `${b2}x^2 + ${a2}y^2 - ${a2*b2} = 0` });
      rows.push({ label: 'Centro', latex: '(0,\\, 0)' });
      rows.push({
        label: 'Vértices',
        latex: isMajorX
          ? `(\\pm ${a},\\, 0)`
          : `(0,\\, \\pm ${b})`,
      });
      rows.push({
        label: 'Focos',
        latex: isMajorX
          ? `(\\pm ${cVal},\\, 0)`
          : `(0,\\, \\pm ${cVal})`,
      });
      rows.push({ label: 'Excentricidad', latex: `e = ${eVal}` });
      break;
    }

    case 'parabola': {
      const { p, orientation } = params;
      const isVertical = orientation === 'up' || orientation === 'down';
      const sign = (orientation === 'up' || orientation === 'right') ? '+' : '-';
      const fourP = 4 * p;

      rows.push({
        label: 'Ecuación general',
        latex: isVertical
          ? `x^2 ${sign === '+' ? '-' : '+'} ${fourP}y = 0`
          : `y^2 ${sign === '+' ? '-' : '+'} ${fourP}x = 0`,
      });
      rows.push({ label: 'Vértice', latex: '(0,\\, 0)' });
      rows.push({
        label: 'Foco',
        latex: isVertical
          ? `(0,\\, ${sign}${p})`
          : `(${sign}${p},\\, 0)`,
      });
      rows.push({
        label: 'Directriz',
        latex: isVertical
          ? `y = ${sign === '+' ? '-' : ''}${p}`
          : `x = ${sign === '+' ? '-' : ''}${p}`,
      });
      rows.push({ label: 'Excentricidad', latex: 'e = 1' });
      break;
    }

    case 'hyperbola': {
      const { a, b, orientation } = params;
      const a2 = a * a, b2 = b * b;
      const cVal = Math.sqrt(a2 + b2).toFixed(3);
      const eVal = (parseFloat(cVal) / a).toFixed(3);
      const isH = orientation === 'horizontal';

      rows.push({
        label: 'Ecuación general',
        latex: isH
          ? `${b2}x^2 - ${a2}y^2 - ${a2*b2} = 0`
          : `${a2}y^2 - ${b2}x^2 - ${a2*b2} = 0`,
      });
      rows.push({ label: 'Centro', latex: '(0,\\, 0)' });
      rows.push({
        label: 'Vértices',
        latex: isH ? `(\\pm ${a},\\, 0)` : `(0,\\, \\pm ${a})`,
      });
      rows.push({
        label: 'Focos',
        latex: isH ? `(\\pm ${cVal},\\, 0)` : `(0,\\, \\pm ${cVal})`,
      });
      rows.push({
        label: 'Asíntotas',
        latex: `y = \\pm \\dfrac{${b}}{${a}}x`,
      });
      rows.push({ label: 'Excentricidad', latex: `e = ${eVal}` });
      break;
    }

    default:
      rows.push({ label: 'Tipo', latex: type });
  }

  return rows;
}

function renderMathSheet(conic) {
  const el = sheetEl();
  if (!el) return;

  const rows = buildMathSheet(conic);

  el.innerHTML = `
    <table class="mathsheet">
      <tbody>
        ${rows.map(({ label, latex }) => {
          const cell = document.createElement('td');
          cell.className = 'mathsheet__value';
          try {
            katex.render(latex, cell, { throwOnError: false, displayMode: false });
          } catch {
            cell.textContent = latex;
          }
          return `
            <tr class="mathsheet__row">
              <td class="mathsheet__label">${label}</td>
              ${cell.outerHTML}
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

// ══════════════════════════════════════════════════════════
//  QR
// ══════════════════════════════════════════════════════════

function renderQR(conic) {
  const el = qrEl();
  if (!el) return;

  // Parámetros de la cónica para la URL
  const queryParams = new URLSearchParams({
    type:   conic.type,
    ...conic.params,
    label:  conic.label ?? '',
  });

  // Si está en entorno local (localhost), usa la URL pública proyectada o de producción
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const baseUrl = isLocal 
    ? 'https://calcmatch.vercel.app' // Reemplazar por tu dominio final desplegado
    : `${window.location.origin}${window.location.pathname}`;

  const viewerUrl = `${baseUrl}?viewer=1&${queryParams}`;

  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&color=7c5cfc&bgcolor=0e0a1c&data=${encodeURIComponent(viewerUrl)}`;

  el.innerHTML = `
    <div class="modal__qr-wrap">
      <img
        class="modal__qr-img"
        src="${qrApiUrl}"
        alt="QR visor 3D"
        width="100"
        height="100"
        loading="lazy"
      />
      <p class="modal__qr-label">Escanea para ver en 3D</p>
    </div>
  `;
}

// ══════════════════════════════════════════════════════════
//  APERTURA / CIERRE
// ══════════════════════════════════════════════════════════

async function openModal(conic) {
  const modal  = modalEl();
  const canvas = canvasEl();
  if (!modal || !canvas) return;

  if (titleEl()) titleEl().textContent = conic.label ?? 'Superficie';
  if (descEl())  descEl().textContent  = conic.description ?? '';

  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  // Ficha matemática y QR (síncronos)
  renderMathSheet(conic);
  renderQR(conic);

  // Three.js (dinámico)
  try {
    if (!render3DModule) render3DModule = await import('../engine/render3D.js');
    render3DModule.initScene(canvas, conic);
  } catch (err) {
    console.error('[Modal] Error al cargar render3D:', err);
  }
}

function closeModal() {
  const modal = modalEl();
  if (!modal) return;
  render3DModule?.disposeScene();
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

// ══════════════════════════════════════════════════════════
//  API PÚBLICA
// ══════════════════════════════════════════════════════════

const Modal = {
  init() {
    EventBus.on('card:matched', ({ cardA }) => openModal(cardA.conic));

    closeBtn()?.addEventListener('click', closeModal);

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeModal();
    });

    modalEl()?.addEventListener('click', e => {
      if (e.target === modalEl()) closeModal();
    });
  },
};

export default Modal;