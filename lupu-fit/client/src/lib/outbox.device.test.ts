import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../env.ts', async (orig) => ({ ...(await orig<typeof import('../env.ts')>()), IS_DEVICE: true, RUN_MODE: 'device' }));
const calls: string[] = [];
vi.mock('../api/client.ts', async (orig) => {
  const real = await orig<typeof import('../api/client.ts')>();
  const h = async (path: string) => { calls.push(path); return { ok: true }; };
  return { ...real, api: { get: h, post: h, put: h, patch: h, delete: h } };
});
const { outbox, callOrQueue } = await import('./outbox.ts');

afterEach(() => { vi.restoreAllMocks(); });

describe('outbox in Device Mode', () => {
  it('offline is no reason to queue: the local database worker answers directly', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const r = await callOrQueue<{ ok: boolean }>({ method: 'POST', path: '/api/sessions/s1/sets', body: {}, label: 'set' });
    expect(r).toEqual({ queued: false, data: { ok: true } });
    expect(calls).toEqual(['/api/sessions/s1/sets']); expect(outbox.list()).toEqual([]);
  });
});
