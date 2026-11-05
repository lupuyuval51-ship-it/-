/** Build-time run mode: `hosted` talks to the Express API, `device` runs the same API inside a Web Worker over PGlite. */
export const RUN_MODE: 'hosted' | 'device' = (import.meta.env['VITE_RUN_MODE'] as string | undefined) === 'device' ? 'device' : 'hosted';
export const IS_DEVICE = RUN_MODE === 'device';
declare const __APP_VERSION__: string | undefined;
/** Release version (root package.json), injected at build time by vite.config.ts. */
export const APP_VERSION: string = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.0.0';
