import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiRequestError, NetworkError } from '../api/client.ts';

const calls: { method: string; path: string; key?: string }[] = [];
let behaviour: (path: string) => unknown = () => ({ ok: true });
vi.mock('../api/client.ts', async (orig) => {
  const real = await orig<typeof import('../api/client.ts')>();
  const h = (method: string) => async (path: string, _b?: unknown, o?: { idempotencyKey?: string }) => { calls.push({ method, path, ...(o?.idempotencyKey ? { key: o.idempotencyKey } : {}) }); const r = behaviour(path); if (r instanceof Error) throw r; return r; };
  return { ...real, api: { get: h('GET'), post: h('POST'), put: h('PUT'), patch: h('PATCH'), delete: h('DELETE') } };
});
const { outbox, callOrQueue } = await import('./outbox.ts');

beforeEach(async () => { calls.length = 0; behaviour = () => ({ ok: true }); for (const i of outbox.list()) await outbox.remove(i.id); });

describe('outbox', () => {
  it('sends directly when online and nothing is queued', async () => {
    const r = await callOrQueue<{ ok: boolean }>({ method: 'POST', path: '/api/food-log', body: {}, label: 'x' });
    expect(r.queued).toBe(false); expect(outbox.list()).toHaveLength(0);
  });
  it('queues on network failure and replays oldest-first with the ORIGINAL idempotency key', async () => {
    behaviour = () => new NetworkError();
    const a = await callOrQueue({ method: 'POST', path: '/api/a', body: {}, label: 'a' });
    const b = await callOrQueue({ method: 'POST', path: '/api/b', body: {}, label: 'b' });
    expect(a.queued && b.queued).toBe(true); expect(outbox.list().map((i) => i.path)).toEqual(['/api/a', '/api/b']);
    const firstKey = outbox.list()[0]!.idempotencyKey;
    calls.length = 0; behaviour = () => ({ ok: true });
    await outbox.flush();
    expect(calls.map((c) => c.path)).toEqual(['/api/a', '/api/b']); expect(calls[0]!.key).toBe(firstKey); expect(outbox.list()).toHaveLength(0);
  });
  it('stops at the first network failure (keeps order) and keeps rejected items visible', async () => {
    behaviour = () => new NetworkError();
    await callOrQueue({ method: 'POST', path: '/api/a', body: {}, label: 'a' }); await callOrQueue({ method: 'POST', path: '/api/b', body: {}, label: 'b' });
    calls.length = 0; await outbox.flush();
    expect(calls).toHaveLength(1); expect(outbox.list()).toHaveLength(2);
    behaviour = (p) => (p === '/api/a' ? new ApiRequestError(409, 'session_finished', {}) : { ok: true });
    await outbox.flush();
    const left = outbox.list(); expect(left).toHaveLength(1); expect(left[0]!.status).toBe('rejected'); expect(left[0]!.error).toBe('session_finished');
    await outbox.retryRejected(left[0]!.id); expect(outbox.list()[0]!.status).toBe('pending');
  });
  it('treats 5xx/429 as transient (stays pending) and propagates validation errors when online', async () => {
    behaviour = () => new NetworkError(); await callOrQueue({ method: 'POST', path: '/api/a', body: {}, label: 'a' });
    behaviour = () => new ApiRequestError(503, 'x', {}); await outbox.flush();
    expect(outbox.list()[0]!.status).toBe('pending');
    behaviour = () => new ApiRequestError(400, 'validation_error', {});
    await expect(callOrQueue({ method: 'POST', path: '/api/z', body: {}, label: 'z' })).rejects.toBeInstanceOf(ApiRequestError);
  });
  it('an empty flush does not wedge later flushes', async () => {
    await outbox.flush();
    behaviour = () => new NetworkError();
    await callOrQueue({ method: 'POST', path: '/api/late', body: {}, label: 'late' });
    calls.length = 0; behaviour = () => ({ ok: true });
    await outbox.flush();
    expect(calls.map((c) => c.path)).toEqual(['/api/late']); expect(outbox.list()).toHaveLength(0);
  });
});

describe('outbox on a shared device', () => {
  const asUser = (id: string) => ({ status: 200, body: { user: { id, username: id, role: 'user' }, csrfToken: 'c', onboarded: true, mode: 'hosted' }, headers: {} });
  async function signIn(id: string) {
    const real = await vi.importActual<typeof import('../api/client.ts')>('../api/client.ts');
    real.setTransport({ request: async () => asUser(id) });
    await real.api.post('/api/auth/login', { username: id, password: 'x' });
  }

  it("never shows or replays another person's queued items; they are still there when that person returns", async () => {
    await signIn('A');
    behaviour = () => new NetworkError();
    await callOrQueue({ method: 'POST', path: '/api/food-log', body: { name: "A's secret rice" }, label: "A's secret rice" });
    expect(outbox.list().map((i) => i.label)).toEqual(["A's secret rice"]);
    await signIn('B');
    expect(outbox.list()).toEqual([]);
    calls.length = 0; behaviour = () => ({ ok: true });
    await outbox.flush();
    expect(calls).toEqual([]); // nothing of A's was sent into B's account
    await signIn('A');
    expect(outbox.list()).toHaveLength(1);
    await outbox.flush();
    expect(calls.map((c) => c.path)).toEqual(['/api/food-log']); expect(outbox.list()).toHaveLength(0);
  });

  it('a signed-out (401) replay waits instead of being marked rejected', async () => {
    await signIn('A');
    behaviour = () => new NetworkError();
    await callOrQueue({ method: 'POST', path: '/api/weights', body: {}, label: 'weigh-in' });
    behaviour = () => new ApiRequestError(401, 'unauthorized', null);
    await outbox.flush();
    expect(outbox.list().map((i) => i.status)).toEqual(['pending']);
  });
});
