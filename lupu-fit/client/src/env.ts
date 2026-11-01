/** Build-time run mode: `hosted` talks to the Express API, `device` runs the same API inside a Web Worker over PGlite. */
export const RUN_MODE: 'hosted' | 'device' = (import.meta.env['VITE_RUN_MODE'] as string | undefined) === 'device' ? 'device' : 'hosted';
export const IS_DEVICE = RUN_MODE === 'device';
/** Optional proxy that holds AI keys for Device Mode (keys are never bundled into the client). */
export const AI_PROXY_URL: string | undefined = (import.meta.env['VITE_AI_PROXY_URL'] as string | undefined) || undefined;
