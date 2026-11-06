import { Capacitor } from '@capacitor/core';

/** Running inside the Capacitor Android shell (assets are packaged, served from https://localhost by the app itself). */
export function isNativeShell(): boolean {
  try { return Capacitor.isNativePlatform(); } catch { return false; }
}

interface Env { prod: boolean; device: boolean; native: boolean }

/**
 * Service worker policy.
 *  - Browser (hosted build, or the device build opened as a web page): register /sw.js (offline shell, clip cache).
 *  - Android app (device build inside Capacitor): every file is already on the phone, so a service worker only copies them into the
 *    Cache API (up to 300 MB of duplicated clips) and could serve stale files after an app update. Never register one, and remove
 *    the registration and caches an earlier build of the app may have left in the WebView.
 */
export async function setupServiceWorker(env: Env, nav: Pick<Navigator, 'serviceWorker'> | undefined = typeof navigator === 'undefined' ? undefined : navigator, cacheStore: CacheStorage | undefined = typeof caches === 'undefined' ? undefined : caches): Promise<'registered' | 'removed' | 'skipped'> {
  const sw = nav?.serviceWorker;
  if (!sw || !env.prod) return 'skipped';
  if (env.device && env.native) {
    try { for (const r of await sw.getRegistrations()) await r.unregister(); } catch { /* nothing to remove */ }
    try { if (cacheStore) for (const k of await cacheStore.keys()) if (k.startsWith('lupu-')) await cacheStore.delete(k); } catch { /* storage unavailable */ }
    return 'removed';
  }
  try { await sw.register('/sw.js'); return 'registered'; } catch { return 'skipped'; }
}
