import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: fileURLToPath(new URL('..', import.meta.url)),
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': fileURLToPath(new URL('../shared', import.meta.url)),
      '@client': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['client/src/**/*.test.{ts,tsx}'],
    environment: 'jsdom',
    setupFiles: ['client/src/test/setup.ts'],
  },
});
