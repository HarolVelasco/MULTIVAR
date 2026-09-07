/**
 * config.js — Configuración global del proyecto.
 */
export const BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'https://calcmatch.vercel.app'
  : `${window.location.origin}${window.location.pathname}`;