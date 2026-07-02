import { defineConfig } from 'vite';

export default defineConfig({
  base: '/cellular-automata-tactics-simulator/',
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    target: 'es2020',
    sourcemap: true,
  },
  worker: {
    format: 'es',
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
