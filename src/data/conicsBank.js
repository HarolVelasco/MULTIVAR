/**
 * conicsBank.js — Banco de preguntas para Desafío Cónico 3D.
 * Regla de distractores: nunca dos del mismo tipo visual que la pregunta.
 * Hipérbola → distractores: círculo + parábola (visualmente distintos).
 */

export const CONICS_BANK = [

  // ── Círculo ────────────────────────────────────────────────
  {
    question: {
      id: 'q-circle-1', type: 'circle', label: 'Círculo',
      latex: 'x^2 + y^2 = 25',
      params: { r: 5 },
      description: 'Círculo centrado en el origen con radio r = 5.',
      mathInfo: {
        canonical: 'x^2 + y^2 = 25',
        general:   'x^2 + y^2 - 25 = 0',
        center:    '(0,\\,0)',
        radius:    'r = 5',
        ecc:       'e = 0',
      },
    },
    distractors: [
      {
        id: 'q-circle-1-d1', type: 'ellipse', label: 'Elipse',
        latex: '\\dfrac{x^2}{25} + \\dfrac{y^2}{9} = 1',
        params: { a: 5, b: 3 },
      },
      {
        id: 'q-circle-1-d2', type: 'parabola', label: 'Parábola',
        latex: 'y = \\dfrac{x^2}{8}',
        params: { p: 2, orientation: 'up' },
      },
    ],
  },

  // ── Elipse vertical ────────────────────────────────────────
  {
    question: {
      id: 'q-ellipse-1', type: 'ellipse', label: 'Elipse',
      latex: '\\dfrac{x^2}{9} + \\dfrac{y^2}{16} = 1',
      params: { a: 3, b: 4 },
      description: 'Elipse con semi-eje mayor b = 4 en Y, semi-eje menor a = 3 en X.',
      mathInfo: {
        canonical:  '\\dfrac{x^2}{9} + \\dfrac{y^2}{16} = 1',
        general:    '16x^2 + 9y^2 - 144 = 0',
        center:     '(0,\\,0)',
        vertices:   '(0,\\,\\pm 4)',
        foci:       '(0,\\,\\pm \\sqrt{7})',
        ecc:        'e = \\dfrac{\\sqrt{7}}{4} \\approx 0.661',
      },
    },
    distractors: [
      {
        id: 'q-ellipse-1-d1', type: 'circle', label: 'Círculo',
        latex: 'x^2 + y^2 = 16',
        params: { r: 4 },
      },
      {
        id: 'q-ellipse-1-d2', type: 'parabola', label: 'Parábola',
        latex: 'y = \\dfrac{x^2}{12}',
        params: { p: 3, orientation: 'up' },
      },
    ],
  },

  // ── Hipérbola horizontal ───────────────────────────────────
  {
    question: {
      id: 'q-hyperbola-1', type: 'hyperbola', label: 'Hipérbola horizontal',
      latex: '\\dfrac{x^2}{4} - \\dfrac{y^2}{9} = 1',
      params: { a: 2, b: 3, orientation: 'horizontal' },
      description: 'Hipérbola horizontal con vértices en (±2, 0).',
      mathInfo: {
        canonical:  '\\dfrac{x^2}{4} - \\dfrac{y^2}{9} = 1',
        general:    '9x^2 - 4y^2 - 36 = 0',
        center:     '(0,\\,0)',
        vertices:   '(\\pm 2,\\,0)',
        foci:       '(\\pm \\sqrt{13},\\,0)',
        asymptotes: 'y = \\pm \\dfrac{3}{2}x',
        ecc:        'e \\approx 1.803',
      },
    },
    distractors: [
      {
        id: 'q-hyperbola-1-d1', type: 'circle', label: 'Círculo',
        latex: 'x^2 + y^2 = 9',
        params: { r: 3 },
      },
      {
        id: 'q-hyperbola-1-d2', type: 'parabola', label: 'Parábola',
        latex: 'x = \\dfrac{y^2}{8}',
        params: { p: 2, orientation: 'right' },
      },
    ],
  },

  // ── Parábola vertical ──────────────────────────────────────
  {
    question: {
      id: 'q-parabola-1', type: 'parabola', label: 'Parábola vertical',
      latex: 'y = \\dfrac{x^2}{8}',
      params: { p: 2, orientation: 'up' },
      description: 'Parábola con vértice en el origen, foco en (0, 2).',
      mathInfo: {
        canonical:  'x^2 = 8y',
        general:    'x^2 - 8y = 0',
        vertex:     '(0,\\,0)',
        focus:      '(0,\\,2)',
        directrix:  'y = -2',
        ecc:        'e = 1',
      },
    },
    distractors: [
      {
        id: 'q-parabola-1-d1', type: 'ellipse', label: 'Elipse',
        latex: '\\dfrac{x^2}{4} + \\dfrac{y^2}{9} = 1',
        params: { a: 2, b: 3 },
      },
      {
        id: 'q-parabola-1-d2', type: 'circle', label: 'Círculo',
        latex: 'x^2 + y^2 = 4',
        params: { r: 2 },
      },
    ],
  },

  // ── Elipse achatada ────────────────────────────────────────
  {
    question: {
      id: 'q-ellipse-2', type: 'ellipse', label: 'Elipse achatada',
      latex: '\\dfrac{x^2}{25} + \\dfrac{y^2}{4} = 1',
      params: { a: 5, b: 2 },
      description: 'Elipse muy achatada con semi-eje mayor a = 5 en X.',
      mathInfo: {
        canonical: '\\dfrac{x^2}{25} + \\dfrac{y^2}{4} = 1',
        general:   '4x^2 + 25y^2 - 100 = 0',
        center:    '(0,\\,0)',
        vertices:  '(\\pm 5,\\,0)',
        foci:      '(\\pm \\sqrt{21},\\,0)',
        ecc:       'e = \\dfrac{\\sqrt{21}}{5} \\approx 0.917',
      },
    },
    distractors: [
      {
        id: 'q-ellipse-2-d1', type: 'circle', label: 'Círculo',
        latex: 'x^2 + y^2 = 25',
        params: { r: 5 },
      },
      {
        id: 'q-ellipse-2-d2', type: 'hyperbola', label: 'Hipérbola',
        latex: '\\dfrac{x^2}{25} - \\dfrac{y^2}{4} = 1',
        params: { a: 5, b: 2, orientation: 'horizontal' },
      },
    ],
  },

  // ── Hipérbola vertical ─────────────────────────────────────
  {
    question: {
      id: 'q-hyperbola-2', type: 'hyperbola', label: 'Hipérbola vertical',
      latex: '\\dfrac{y^2}{16} - \\dfrac{x^2}{9} = 1',
      params: { a: 4, b: 3, orientation: 'vertical' },
      description: 'Hipérbola vertical con vértices en (0, ±4).',
      mathInfo: {
        canonical:  '\\dfrac{y^2}{16} - \\dfrac{x^2}{9} = 1',
        general:    '9y^2 - 16x^2 - 144 = 0',
        center:     '(0,\\,0)',
        vertices:   '(0,\\,\\pm 4)',
        foci:       '(0,\\,\\pm 5)',
        asymptotes: 'y = \\pm \\dfrac{4}{3}x',
        ecc:        'e = 1.25',
      },
    },
    distractors: [
      {
        id: 'q-hyperbola-2-d1', type: 'ellipse', label: 'Elipse',
        latex: '\\dfrac{x^2}{9} + \\dfrac{y^2}{16} = 1',
        params: { a: 3, b: 4 },
      },
      {
        id: 'q-hyperbola-2-d2', type: 'parabola', label: 'Parábola',
        latex: 'y = \\dfrac{x^2}{16}',
        params: { p: 4, orientation: 'up' },
      },
    ],
  },
];

export function shuffledBank() {
  const arr = [...CONICS_BANK];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}