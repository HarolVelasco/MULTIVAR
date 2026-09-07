import { defineConfig } from 'vite';

export default defineConfig({
  // Directorio raíz donde está index.html
  root: '.',

  // Assets estáticos
  publicDir: 'public',

  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },

  server: {
    port: 5173,
    open: true,
  },
});