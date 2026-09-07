/**
 * render2D.js — Dibuja cónicas en <canvas> con ecuaciones paramétricas correctas.
 *
 * Dispatcher principal:
 *   renderConic(canvas, conic) — llama al renderizador según conic.type
 */

// ══════════════════════════════════════════════════════════
//  UTILIDADES
// ══════════════════════════════════════════════════════════

/**
 * Prepara el contexto: HiDPI, origen en el centro, Y hacia arriba.
 * Devuelve { ctx, W, H } en píxeles CSS (sin escala DPR).
 */
function setupCtx(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const W   = canvas.clientWidth  || canvas.width  || 160;
  const H   = canvas.clientHeight || canvas.height || 120;

  // Aplicar DPR solo una vez
  if (!canvas.dataset.dpr) {
    canvas.width        = W * dpr;
    canvas.height       = H * dpr;
    canvas.style.width  = `${W}px`;
    canvas.style.height = `${H}px`;
    canvas.dataset.dpr  = dpr;
  }

  const ctx = canvas.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);          // reset total
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const dprN = Number(canvas.dataset.dpr);
  ctx.scale(dprN, dprN);                        // escala DPR
  ctx.translate(W / 2, H / 2);                 // origen al centro
  ctx.scale(1, -1);                             // Y hacia arriba

  return { ctx, W, H };
}

/** Ejes finos de referencia. */
function drawAxes(ctx, W, H) {
  ctx.save();
  ctx.strokeStyle = 'rgba(180,180,220,0.22)';
  ctx.lineWidth   = 0.7;
  ctx.beginPath();
  ctx.moveTo(-W / 2, 0); ctx.lineTo(W / 2, 0);   // X
  ctx.moveTo(0, -H / 2); ctx.lineTo(0, H / 2);   // Y
  ctx.stroke();
  ctx.restore();
}

/**
 * Traza una polilínea dado un array de {x, y} ya en píxeles canvas.
 * No aplica ninguna escala extra — el llamador la calcula.
 */
function polyline(ctx, pts, close = false) {
  if (!pts.length) return;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  if (close) ctx.closePath();
}

/** Trazo neón con glow. */
function neonStroke(ctx, color, width = 2) {
  ctx.strokeStyle  = color;
  ctx.lineWidth    = width;
  ctx.shadowBlur   = 14;
  ctx.shadowColor  = color;
  ctx.lineJoin     = 'round';
  ctx.lineCap      = 'round';
  ctx.stroke();
  ctx.shadowBlur   = 0;
}

// ══════════════════════════════════════════════════════════
//  RENDERIZADORES
// ══════════════════════════════════════════════════════════

/* ── Círculo ─────────────────────────────────────────────
   x = r·cos(t),  y = r·sin(t)
   Escala: el radio ocupa el 78 % del semieje menor del canvas.
*/
function drawCircle(canvas, { r = 1 }) {
  const { ctx, W, H } = setupCtx(canvas);
  const scale = (Math.min(W, H) / 2) * 0.78 / r;

  drawAxes(ctx, W, H);

  const N   = 256;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const t = (2 * Math.PI * i) / N;
    pts.push({ x: r * Math.cos(t) * scale, y: r * Math.sin(t) * scale });
  }

  polyline(ctx, pts, true);
  neonStroke(ctx, '#00e5ff');
}

/* ── Elipse ──────────────────────────────────────────────
   x = a·cos(t),  y = b·sin(t)
*/
function drawEllipse(canvas, { a = 3, b = 4 }) {
  const { ctx, W, H } = setupCtx(canvas);
  const maxR  = Math.max(a, b);
  const scale = (Math.min(W, H) / 2) * 0.78 / maxR;

  drawAxes(ctx, W, H);

  const N   = 256;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const t = (2 * Math.PI * i) / N;
    pts.push({ x: a * Math.cos(t) * scale, y: b * Math.sin(t) * scale });
  }

  polyline(ctx, pts, true);
  neonStroke(ctx, '#7c5cfc');
}

/* ── Parábola ────────────────────────────────────────────
   Vertical   (up/down):   y = ±x² / (4p)
   Horizontal (right/left): x = ±y² / (4p)

   Dibujamos barriendo el parámetro libre en [-rango, +rango]
   y mapeamos con escala uniforme para que quepa en el canvas.
*/
function drawParabola(canvas, { p = 2, orientation = 'up' }) {
  const { ctx, W, H } = setupCtx(canvas);

  const isVertical = orientation === 'up' || orientation === 'down';
  const sign       = (orientation === 'up' || orientation === 'right') ? 1 : -1;

  // Rango del parámetro libre: ajustado para que la curva llene el canvas
  const halfCanvas = Math.min(W, H) / 2;
  // Escala uniforme: 1 unidad matemática = scale píxeles
  // Elegimos scale para que el parámetro libre en ±2.5 ocupe ±80 % del canvas
  const paramRange = 2.5;                          // unidades matemáticas
  const scale      = halfCanvas * 0.80 / paramRange;

  drawAxes(ctx, W, H);

  const N   = 200;
  const pts = [];

  for (let i = 0; i <= N; i++) {
    const u = ((i / N) * 2 - 1) * paramRange;     // u ∈ [-2.5, 2.5]

    let x, y;
    if (isVertical) {
      // y = sign·u² / (4p)
      x =  u;
      y =  sign * (u * u) / (4 * p);
    } else {
      // x = sign·u² / (4p)
      x =  sign * (u * u) / (4 * p);
      y =  u;
    }
    pts.push({ x: x * scale, y: y * scale });
  }

  polyline(ctx, pts);
  neonStroke(ctx, '#ff6d9d');
}

/* ── Hipérbola ───────────────────────────────────────────
   Usamos la parametrización con cosh/sinh que produce
   AMBAS ramas sin discontinuidades:

   Horizontal: rama derecha  x = +a·cosh(t), y = b·sinh(t)
               rama izquierda x = -a·cosh(t), y = b·sinh(t)

   Vertical:   rama superior  x = a·sinh(t), y = +b·cosh(t)
               rama inferior  x = a·sinh(t), y = -b·cosh(t)

   t ∈ [-T, T] con T suficiente para que las ramas se vean completas.
*/
function drawHyperbola(canvas, { a = 2, b = 3, orientation = 'horizontal' }) {
  const { ctx, W, H } = setupCtx(canvas);

  const T     = 1.8;                                // rango de t
  const N     = 200;
  const maxR  = Math.max(a, b);
  const scale = (Math.min(W, H) / 2) * 0.72 / (maxR * Math.cosh(T));

  drawAxes(ctx, W, H);

  // Genera puntos de una rama
  function branch(signCosh) {
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const t  = ((i / N) * 2 - 1) * T;
      const ch = Math.cosh(t);
      const sh = Math.sinh(t);
      let x, y;
      if (orientation === 'horizontal') {
        x = signCosh * a * ch;
        y = b * sh;
      } else {
        x = a * sh;
        y = signCosh * b * ch;
      }
      pts.push({ x: x * scale, y: y * scale });
    }
    return pts;
  }

  // Rama 1
  polyline(ctx, branch(+1));
  neonStroke(ctx, '#ffd166');

  // Rama 2
  polyline(ctx, branch(-1));
  neonStroke(ctx, '#ffd166');
}

// ══════════════════════════════════════════════════════════
//  DISPATCHER
// ══════════════════════════════════════════════════════════

const RENDERERS = {
  circle:    drawCircle,
  ellipse:   drawEllipse,
  parabola:  drawParabola,
  hyperbola: drawHyperbola,
};

/**
 * @param {HTMLCanvasElement} canvas
 * @param {Object}            conic  — objeto del array CONICS
 */
export function renderConic(canvas, conic) {
  const fn = RENDERERS[conic.type];
  if (fn) {
    fn(canvas, conic.params ?? {});
  } else {
    console.warn(`[render2D] Tipo desconocido: "${conic.type}"`);
  }
}