/** Build-time run mode: `hosted` talks to the Express API, `device` runs the same API inside a Web Worker over PGlite. */
export const RUN_MODE: 'hosted' | 'device' = (import.meta.env['VITE_RUN_MODE'] as string | undefined) === 'device' ? 'device' : 'hosted';
export const IS_DEVICE = RUN_MODE === 'device';
declare const __APP_VERSION__: string | undefined;
/** Release version (root package.json), injected at build time by vite.config.ts. */
export const APP_VERSION: string = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.0.0';
/** Device Mode only: the optional AI proxy (`VITE_AI_PROXY_URL`). The shipped Android build does not set it, so it has no AI at all. */
export const AI_PROXY_URL: string | undefined = ((import.meta.env['VITE_AI_PROXY_URL'] as string | undefined) ?? '').trim() || undefined;
/**
 * Is there an AI service behind the app? Hosted: the operator may have configured one (the server answers `ai_unavailable` otherwise).
 * Device Mode: only with an AI proxy. Everything AI-only in the UI (photo estimate, "more languages") is hidden when this is false.
 */
export const AI_AVAILABLE: boolean = !IS_DEVICE || AI_PROXY_URL !== undefined;
