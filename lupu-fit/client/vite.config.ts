import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Two builds from one codebase: `vite build --mode hosted` (talks to the Express API) and
// `vite build --mode device` (PGlite in a Web Worker, no server).
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  build: { outDir: mode === 'device' ? 'dist-device' : 'dist', target: 'es2022', sourcemap: false, chunkSizeWarningLimit: 2500 },
  worker: { format: 'es' },
  optimizeDeps: { exclude: ['@electric-sql/pglite'] },
  server: { port: 5173, fs: { allow: [resolve(__dirname, '..')] }, proxy: { '/api': 'http://localhost:8080' } },
  test: { environment: 'jsdom', globals: true, setupFiles: ['./src/test/setup.ts'], css: false, include: ['src/**/*.test.{ts,tsx}'] },
}));
