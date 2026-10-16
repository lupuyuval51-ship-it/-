import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwind from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const here = path.dirname(fileURLToPath(import.meta.url));
const r = (p: string) => path.resolve(here, p);

/**
 * The offline Android app: the same game code as the website (`../src`), bundled as static files for Capacitor.
 * Next.js-only modules are replaced by tiny shims; `server-only` throws so server code can never be bundled.
 */
export default defineConfig({
  root: here,
  base: "./",
  plugins: [react(), tailwind()],
  resolve: {
    alias: [
      { find: /^next\/link$/, replacement: r("src/shims/next-link.tsx") },
      { find: /^next\/navigation$/, replacement: r("src/shims/next-navigation.ts") },
      { find: /^next\/dynamic$/, replacement: r("src/shims/next-dynamic.tsx") },
      { find: /^server-only$/, replacement: r("src/shims/server-only.ts") },
      { find: /^@\//, replacement: `${r("../src")}/` },
    ],
  },
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
  // The first chunk (library) is about 550 kB (the cloud library is its own chunk, loaded only for a signed-in phone) and the lazily loaded 3D renderer (three + react-three-fiber) about 1 MB: the
  // limit sits just above the renderer so that a screen that pulls it into the first chunk shows up as a build warning
  // (tests/unit/bundle-boundary.test.ts checks the same boundary without a build).
  build: { outDir: r("dist"), emptyOutDir: true, chunkSizeWarningLimit: 1100, sourcemap: false },
});
