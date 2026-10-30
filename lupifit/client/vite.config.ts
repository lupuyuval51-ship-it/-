import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { DEVICE_ALIASES } from './src/device/aliases';

const apiTarget = process.env.VITE_API_TARGET ?? 'http://127.0.0.1:3000';
const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

/** Our own code (server, shared, device runtime): the only importers whose Node imports are replaced. */
const OWN_CODE = [here('../server/'), here('../shared/'), here('./src/device/')];

/**
 * Device mode: the server code runs in the device worker, with `pg`, `express`, Node built-ins and
 * server-only packages replaced by the shims and stubs in src/device (see src/device/aliases.ts).
 * Applied to the worker bundle only, and only to imports from our own code (PGlite's Node-only branches
 * keep Vite's browser stubs).
 */
function deviceAliases(): Plugin {
  return {
    name: 'lupufit-device-aliases',
    enforce: 'pre',
    resolveId(source, importer) {
      if (!importer || !OWN_CODE.some((dir) => importer.startsWith(dir))) return null;
      const alias = DEVICE_ALIASES.find((a) => a.find.test(source));
      return alias ? alias.replacement : null;
    },
    // Vite replaces `process.env` with a build-time object; the server reads the device environment at
    // run time from the `process` global installed by src/device/install-globals.ts.
    transform(code, id) {
      if (!OWN_CODE.some((dir) => id.startsWith(dir)) || !/\bprocess\.env\b/.test(code)) return null;
      return { code: code.replace(/(?<![.\w$])process\.env\b/g, "globalThis['process'].env"), map: null };
    },
  };
}

/**
 * Server-mode builds never contain the device runtime. main.tsx imports it only in a branch that is dead
 * outside device mode, but Rollup still loads a dynamically imported module (and Vite would bundle its
 * worker, i.e. the whole server): the import resolves to an empty module instead.
 */
function withoutDeviceRuntime(): Plugin {
  const start = here('./src/features/device/start.ts');
  const STUB = '\0lupufit-no-device-runtime';
  return {
    name: 'lupufit-without-device-runtime',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      if (!source.endsWith('features/device/start')) return null;
      const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
      return resolved?.id === start ? STUB : null;
    },
    load(id) {
      if (id !== STUB) return null;
      return "export function startDevice() { throw new Error('This build has no device mode'); }\nexport function DeviceGate() { return null; }\nexport async function installNative() {}\n";
    },
  };
}

/**
 * Asset file names in the device build. Android's packager (aapt) unpacks `.gz` assets and drops the
 * suffix, so a file named `*.gz` is not in the APK under the name the code asks for (PGlite's `pg_trgm`
 * bundle, `pg_trgm.tar.gz`, would be missing and the database could not start). Such files keep their
 * gzip content under a `.bin` name; PGlite decompresses what it fetches either way.
 * android/build-release.sh checks that every dist/device file is in the APK under its own name.
 */
export function deviceAssetName(asset: { names?: readonly string[]; name?: string }): string {
  const name = asset.names?.[0] ?? asset.name ?? '';
  if (/\.gz$/i.test(name)) return `assets/${name.replace(/\.[^/]*$/, '').replace(/[^\w-]+/g, '_')}-[hash].gz.bin`;
  return 'assets/[name]-[hash][extname]';
}

/**
 * Device mode has no server to send security headers, so the page carries its CSP as a meta tag (the same
 * policy as the hosted app's header, see server/src/middleware/security.ts). WebAssembly needs
 * 'wasm-unsafe-eval'. A meta CSP covers the page only, not the device worker (a dedicated worker loaded from
 * its own URL, and the Android app's local server sends no CSP header): the worker, where the barcode
 * lookup to Open Food Facts runs, enforces the same connect-src itself (src/device/network-guard.ts, whose
 * test checks that both lists match).
 */
export const DEVICE_CSP = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "worker-src 'self'",
  "style-src 'self'",
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  "connect-src 'self' https://world.openfoodfacts.org",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

function deviceCsp(): Plugin {
  return {
    name: 'lupufit-device-csp',
    transformIndexHtml: {
      order: 'post',
      handler: () => [{ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: DEVICE_CSP }, injectTo: 'head-prepend' }],
    },
  };
}

export default defineConfig(({ mode }) => {
  const device = mode === 'device';
  return {
    root: here('.'),
    plugins: [react(), ...(device ? [deviceCsp()] : [withoutDeviceRuntime()])],
    resolve: {
      alias: {
        '@shared': here('../shared'),
        '@client': here('./src'),
      },
    },
    server: {
      port: 5173,
      strictPort: true,
      proxy: { '/api': { target: apiTarget, changeOrigin: false } },
    },
    // PGlite loads its .wasm/.data files next to its own module: never pre-bundle it (dev server).
    optimizeDeps: device ? { exclude: ['@electric-sql/pglite'] } : undefined,
    worker: device
      ? {
          format: 'es' as const,
          plugins: () => [deviceAliases()],
          rollupOptions: {
            output: { entryFileNames: 'assets/device-worker-[hash].js', chunkFileNames: 'assets/device-[name]-[hash].js', assetFileNames: deviceAssetName },
          },
        }
      : undefined,
    build: {
      outDir: here(device ? '../dist/device' : '../dist/client'),
      emptyOutDir: true,
      // Device build: no source maps in the app package (they would double its size).
      sourcemap: !device,
      chunkSizeWarningLimit: device ? 3000 : 700,
      ...(device ? { rollupOptions: { output: { assetFileNames: deviceAssetName } } } : {}),
    },
  };
});
