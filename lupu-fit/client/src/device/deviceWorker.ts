/// <reference lib="webworker" />
/**
 * Device Mode worker: the SAME portable API app that the hosted server uses, running over PGlite persisted in IndexedDB.
 *  - one worker = one writer; requests are serialised through a promise queue so transactions never interleave
 *  - the hidden local account, its provisioning and the physical wipe on account deletion live in deviceCore.ts
 *  - network egress is restricted to same-origin, Open Food Facts and the optional AI proxy
 */
import { DEFAULT_DEPS } from '../../../server/src/createApp.ts';
import type { TransportRequest } from '../api/transport.ts';
import type { Deps } from '../../../server/src/core/types.ts';
import { createDeviceServer, idbStore, type DeviceServer } from './deviceCore.ts';
import { ProxyAiProvider } from './proxyAi.ts';

const ctx = self as unknown as DedicatedWorkerGlobalScope;
const ALLOWED_HOSTS = new Set(['world.openfoodfacts.org']);

export function makeGuardedFetch(aiProxy: string | undefined, base: typeof fetch = fetch): typeof fetch {
  const proxyHost = aiProxy ? new URL(aiProxy).host : null;
  return ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url, ctx.location.href);
    const ok = url.origin === ctx.location.origin || ALLOWED_HOSTS.has(url.host) || (proxyHost !== null && url.host === proxyHost);
    if (!ok) return Promise.reject(new Error(`egress_blocked:${url.host}`));
    return base(input, init);
  }) as typeof fetch;
}

let server: DeviceServer | null = null;
let queue: Promise<unknown> = Promise.resolve();

function init(): Promise<void> {
  const aiProxy = (import.meta.env['VITE_AI_PROXY_URL'] as string | undefined) || undefined;
  const f = makeGuardedFetch(aiProxy);
  const s = createDeviceServer(idbStore(), (db): Deps => ({
    db, mode: 'device', clock: () => new Date(), ...DEFAULT_DEPS, sessionTtlDays: 3650, secureCookies: false, fetch: f,
    // No proxy => no AI (rules coach / ai_unavailable for translate); with VITE_AI_PROXY_URL the proxy holds the keys.
    ai: aiProxy ? new ProxyAiProvider(aiProxy, f) : undefined,
  }));
  server = s;
  return s.boot();
}

const message = (err: unknown, fallback: string): string => (err instanceof Error ? err.message : fallback);

ctx.onmessage = (e: MessageEvent<{ type: 'init' } | { type: 'req'; id: number; req: TransportRequest }>) => {
  const m = e.data;
  if (m.type === 'init') {
    queue = queue.then(() => init().then(() => ctx.postMessage({ type: 'ready' }), (err: unknown) => ctx.postMessage({ type: 'fatal', message: message(err, String(err)) })));
    return;
  }
  queue = queue.then(async () => {
    let after: (() => Promise<void>) | undefined;
    try {
      const out = await (server as DeviceServer).handle(m.req);
      after = out.after;
      ctx.postMessage({ type: 'res', id: m.id, res: out.res });
    } catch (err) { ctx.postMessage({ type: 'err', id: m.id, message: message(err, 'worker_error') }); return; }
    // The deletion is answered first, so the client wipes the deleted person's local state even if setting up the fresh database fails.
    if (after) { try { await after(); } catch (err) { ctx.postMessage({ type: 'fatal', message: message(err, 'device_reset_failed') }); } }
  });
};
