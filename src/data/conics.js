/**
 * CONICS — Array de cónicas del juego.
 * Cada objeto representa UNA PAREJA de cartas (ecuación + gráfica).
 *
 * Campos:
 *  id         — identificador único de la pareja
 *  type       — 'circle' | 'ellipse' | 'parabola' | 'hyperbola'
 *  latex      — string LaTeX para KaTeX (carta tipo A)
 *  label      — nombre legible mostrado bajo la gráfica
 *  params     — parámetros numéricos para render2D y render3D
 *  difficulty — 1 (fácil) | 2 (medio) | 3 (difícil)
 *  description— texto de apoyo para el modal 3D
 */
export const CONICS = [
  {
    id: 'circle-1',
    type: 'circle',
    latex: 'x^2 + y^2 = 25',
    label: 'Círculo',
    params: { r: 5 },
    difficulty: 1,
    description: 'Círculo centrado en el origen con radio r = 5.',
  },
  {
    id: 'ellipse-1',
    type: 'ellipse',
    latex: '\\dfrac{x^2}{9} + \\dfrac{y^2}{16} = 1',
    label: 'Elipse',
    params: { a: 3, b: 4 },
    difficulty: 1,
    description: 'Elipse con semi-eje mayor b = 4 (eje Y) y semi-eje menor a = 3 (eje X).',
  },
  {
    id: 'parabola-1',
    type: 'parabola',
    latex: 'y = \\dfrac{x^2}{8}',
    label: 'Parábola',
    params: { p: 2, orientation: 'up' },
    difficulty: 1,
    description: 'Parábola vertical con vértice en el origen y foco en (0, 2).',
  },
  {
    id: 'hyperbola-1',
    type: 'hyperbola',
    latex: '\\dfrac{x^2}{4} - \\dfrac{y^2}{9} = 1',
    label: 'Hipérbola',
    params: { a: 2, b: 3, orientation: 'horizontal' },
    difficulty: 2,
    description: 'Hipérbola horizontal con vértices en (±2, 0).',
  },
  {
    id: 'ellipse-2',
    type: 'ellipse',
    latex: '\\dfrac{x^2}{25} + \\dfrac{y^2}{4} = 1',
    label: 'Elipse achatada',
    params: { a: 5, b: 2 },
    difficulty: 2,
    description: 'Elipse con semi-eje mayor a = 5 (eje X) y semi-eje menor b = 2 (eje Y).',
  },
  {
    id: 'parabola-2',
    type: 'parabola',
    latex: 'x = \\dfrac{y^2}{12}',
    label: 'Parábola horizontal',
    params: { p: 3, orientation: 'right' },
    difficulty: 2,
    description: 'Parábola horizontal con vértice en el origen y foco en (3, 0).',
  },
  {
    id: 'circle-2',
    type: 'circle',
    latex: 'x^2 + y^2 = 9',
    label: 'Círculo pequeño',
    params: { r: 3 },
    difficulty: 1,
    description: 'Círculo centrado en el origen con radio r = 3.',
  },
  {
    id: 'hyperbola-2',
    type: 'hyperbola',
    latex: '\\dfrac{y^2}{16} - \\dfrac{x^2}{9} = 1',
    label: 'Hipérbola vertical',
    params: { a: 4, b: 3, orientation: 'vertical' },
    difficulty: 3,
    description: 'Hipérbola vertical con vértices en (0, ±4).',
  },
];