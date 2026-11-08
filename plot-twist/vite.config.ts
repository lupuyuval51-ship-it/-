/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/** Mounts the server API (/api/*) inside the Vite dev & preview servers, so one process runs everything. */
function plotTwistApi(): Plugin {
  const mount = async (middlewares: { use: (fn: (req: any, res: any, next: (err?: unknown) => void) => void) => void }) => {
    const { createApiHandler } = await import('./server/api.ts');
    const handle = createApiHandler();
    middlewares.use((req, res, next) => {
      if (!req.url || !req.url.startsWith('/api/')) return next();
      handle(req, res).catch(next);
    });
  };
  return {
    name: 'plot-twist-api',
    async configureServer(server) {
      await mount(server.middlewares);
    },
    async configurePreviewServer(server) {
      await mount(server.middlewares);
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), plotTwistApi()],
  server: { port: 5173, strictPort: false },
  build: { target: 'es2022', sourcemap: true },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
