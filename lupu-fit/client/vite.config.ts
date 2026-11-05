import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// The release version lives in the root package.json (the one the Android build reads); client/package.json is only a workspace stub.
const APP_VERSION = (JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf8')) as { version: string }).version;

// Two builds from one codebase: `vite build --mode hosted` (talks to the Express API) and
// `vite build --mode device` (PGlite in a Web Worker, no server).
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  define: { __APP_VERSION__: JSON.stringify(APP_VERSION) },
  build: { outDir: mode === 'device' ? 'dist-device' : 'dist', target: 'es2022', sourcemap: false, chunkSizeWarningLimit: 2500 },
  worker: { format: 'es' },
  optimizeDeps: { exclude: ['@electric-sql/pglite'] },
  server: { port: 5173, fs: { allow: [resolve(__dirname, '..')] }, proxy: { '/api': 'http://localhost:8080' } },
  test: { environment: 'jsdom', globals: true, setupFiles: ['./src/test/setup.ts'], css: false, include: ['src/**/*.test.{ts,tsx}'] },
}));
