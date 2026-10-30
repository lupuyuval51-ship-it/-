/**
 * The device worker's network policy. The page's Content-Security-Policy (a <meta> tag, see DEVICE_CSP in
 * client/vite.config.ts) does not apply to a dedicated worker loaded from its own URL, and the Android
 * app's local server sends no CSP header, so the worker, where the server code, PGlite and the only remote
 * call (the Open Food Facts barcode lookup) run, enforces the same rule itself:
 * - `fetch` reaches only this app's own origin and `DEVICE_REMOTE_ORIGINS`; anything else is refused before
 *   a request is made (a TypeError, like a network failure);
 * - XMLHttpRequest, WebSocket, EventSource and importScripts are removed (nothing in the worker uses them).
 * Installed by ./install-globals.ts before any server module or library is evaluated. Adding an origin
 * here is a privacy change (AGENTS.md): update DEVICE_CSP, the device legal texts and the Data safety form.
 */

/** The only remote origins the worker may contact (the barcode lookup). Keep in step with DEVICE_CSP's connect-src. */
export const DEVICE_REMOTE_ORIGINS: readonly string[] = ['https://world.openfoodfacts.org'];

export class BlockedRequestError extends TypeError {
  constructor(readonly origin: string) {
    super(`Blocked by the device network policy: ${origin}`);
    this.name = 'BlockedRequestError';
  }
}

/** The origin a fetch input points at, resolved like fetch would (relative to `base`), or null if it is not a URL. */
export function requestOrigin(input: unknown, base: string): string | null {
  const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as { url?: unknown } | null)?.url;
  if (typeof raw !== 'string') return null;
  try {
    const url = new URL(raw, base);
    // data: and blob: URLs never leave the phone (PGlite may read its bundles that way).
    if (url.protocol === 'data:' || url.protocol === 'blob:') return 'local:';
    return url.origin;
  } catch {
    return null;
  }
}

export function isAllowedOrigin(origin: string | null, selfOrigin: string, allowed: readonly string[] = DEVICE_REMOTE_ORIGINS): boolean {
  return origin === 'local:' || (origin !== null && (origin === selfOrigin || allowed.includes(origin)));
}

type GuardScope = {
  fetch?: typeof fetch;
  location?: { href: string; origin: string };
  XMLHttpRequest?: unknown;
  WebSocket?: unknown;
  EventSource?: unknown;
  importScripts?: unknown;
};

const GUARDED = Symbol.for('lupufit.networkGuard');

/** Installs the policy on the worker's global scope (idempotent). */
export function installNetworkGuard(scope: GuardScope = globalThis as unknown as GuardScope, allowed: readonly string[] = DEVICE_REMOTE_ORIGINS): void {
  const marked = scope as GuardScope & { [GUARDED]?: boolean };
  if (marked[GUARDED]) return;
  marked[GUARDED] = true;
  const base = scope.location?.href ?? 'https://localhost/';
  const selfOrigin = scope.location?.origin ?? new URL(base).origin;
  const realFetch = scope.fetch?.bind(scope);
  if (realFetch) {
    scope.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
      const origin = requestOrigin(input, base);
      if (!isAllowedOrigin(origin, selfOrigin, allowed)) return Promise.reject(new BlockedRequestError(origin ?? String(input)));
      return realFetch(input, init);
    }) as typeof fetch;
  }
  const refuse = (what: string) =>
    function blocked() {
      throw new TypeError(`${what} is not available in the device worker (device network policy)`);
    };
  for (const name of ['XMLHttpRequest', 'WebSocket', 'EventSource', 'importScripts'] as const) {
    if (name in scope) {
      try {
        Object.defineProperty(scope, name, { value: refuse(name), configurable: false, writable: false });
      } catch {
        /* a non-configurable global stays; nothing in the worker uses it */
      }
    }
  }
}
