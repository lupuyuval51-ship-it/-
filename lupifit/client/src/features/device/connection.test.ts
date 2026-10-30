import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiDelete, apiGet, apiPost, setTransport } from '../../api/client';
import type { PageMessage, WorkerMessage } from '../../device/worker/protocol';
import { connectDevice, type WorkerLike } from './connection';

/** A stand-in for the device worker: records what the page sends, lets the test answer. */
class FakeWorker implements WorkerLike {
  sent: PageMessage[] = [];
  #message: ((e: MessageEvent<WorkerMessage>) => void)[] = [];
  #error: ((e: Event) => void)[] = [];
  postMessage(message: PageMessage) {
    this.sent.push(structuredClone(message));
  }
  addEventListener(type: 'message' | 'error', listener: (e: never) => void) {
    if (type === 'message') this.#message.push(listener as (e: MessageEvent<WorkerMessage>) => void);
    else this.#error.push(listener as (e: Event) => void);
  }
  emit(msg: WorkerMessage) {
    for (const l of this.#message) l(new MessageEvent('message', { data: msg }));
  }
  crash() {
    for (const l of this.#error) l(new Event('error'));
  }
  requests() {
    return this.sent.filter((m): m is Extract<PageMessage, { type: 'request' }> => m.type === 'request');
  }
}

const ACCOUNT = { locale: 'en' as const, timezone: 'Asia/Jerusalem', displayName: 'Me' };
const flush = () => new Promise((r) => setTimeout(r, 0));

afterEach(() => setTransport(null));

describe('connectDevice', () => {
  it('sends init first and follows the boot state', () => {
    const worker = new FakeWorker();
    const conn = connectDevice(worker, ACCOUNT);
    expect(worker.sent).toEqual([{ type: 'init', account: ACCOUNT }]);
    expect(conn.getState()).toEqual({ state: 'booting', step: 'database', firstLaunch: false });
    const seen: string[] = [];
    const off = conn.subscribe(() => seen.push(conn.getState().state));
    worker.emit({ type: 'state', boot: { state: 'locked' } });
    worker.emit({ type: 'state', boot: { state: 'ready', bootMs: 12, steps: {} } });
    off();
    worker.emit({ type: 'state', boot: { state: 'failed', reason: 'unknown', detail: 'x' } });
    expect(seen).toEqual(['locked', 'ready']);
    expect(conn.getState()).toMatchObject({ state: 'failed' });
  });

  it('erases through the worker ("Erase all data on this phone"), and asks for an unfinished erase at start', async () => {
    const worker = new FakeWorker();
    const conn = connectDevice(worker, ACCOUNT);
    const done = conn.erase();
    const msg = worker.sent.at(-1) as Extract<PageMessage, { type: 'erase' }>;
    expect(msg.type).toBe('erase');
    worker.emit({ type: 'erased', id: msg.id, ok: true });
    await expect(done).resolves.toBeUndefined();
    const failing = conn.erase();
    worker.emit({ type: 'erased', id: (worker.sent.at(-1) as { id: number }).id, ok: false, message: 'blocked' });
    await expect(failing).rejects.toThrow('blocked');

    const next = new FakeWorker();
    const atStart = vi.fn();
    connectDevice(next, ACCOUNT, { eraseFirst: true, onErasedAtStart: atStart });
    expect(next.sent).toEqual([{ type: 'init', account: ACCOUNT, erase: true }]);
    next.emit({ type: 'erased', id: 0, ok: true });
    expect(atStart).toHaveBeenCalledWith(true);
  });

  it('turns a request into a message and the answer into a real Response', async () => {
    const worker = new FakeWorker();
    const { transport } = connectDevice(worker, ACCOUNT);
    const pending = transport('/api/nutrition/day?date=2026-10-30', { method: 'post', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': 't' }, body: '{"a":1}' });
    const [req] = worker.requests();
    expect(req).toEqual({
      type: 'request',
      id: 1,
      method: 'POST',
      url: '/api/nutrition/day?date=2026-10-30',
      headers: { 'content-type': 'application/json', 'x-csrf-token': 't' },
      body: '{"a":1}',
    });
    worker.emit({ type: 'response', id: 1, status: 201, headers: [['Content-Type', 'application/json'], ['Idempotent-Replayed', 'true']], body: '{"ok":true}' });
    const res = await pending;
    expect(res).toBeInstanceOf(Response);
    expect(res.status).toBe(201);
    expect(res.ok).toBe(true);
    expect(res.headers.get('idempotent-replayed')).toBe('true');
    expect(await res.json()).toEqual({ ok: true });
  });

  it('gives 204 answers no body (like fetch)', async () => {
    const worker = new FakeWorker();
    const { transport } = connectDevice(worker, ACCOUNT);
    const pending = transport('/api/x', { method: 'DELETE' });
    worker.emit({ type: 'response', id: 1, status: 204, headers: [], body: '' });
    const res = await pending;
    expect(res.status).toBe(204);
    expect(await res.text()).toBe('');
  });

  it('rejects like a network error when the worker cannot answer, or stops', async () => {
    const worker = new FakeWorker();
    const conn = connectDevice(worker, ACCOUNT);
    const failed = conn.transport('/api/a');
    worker.emit({ type: 'request-failed', id: 1, message: 'boom' });
    await expect(failed).rejects.toBeInstanceOf(TypeError);
    const stranded = conn.transport('/api/b');
    worker.crash();
    await expect(stranded).rejects.toBeInstanceOf(TypeError);
    expect(conn.getState()).toEqual({ state: 'failed', reason: 'unknown', detail: 'The device worker stopped' });
  });

  it('honours AbortSignal like fetch (before and while waiting) and ignores the late answer', async () => {
    const worker = new FakeWorker();
    const { transport } = connectDevice(worker, ACCOUNT);
    const early = new AbortController();
    early.abort();
    await expect(transport('/api/a', { signal: early.signal })).rejects.toMatchObject({ name: 'AbortError' });
    expect(worker.requests()).toHaveLength(0);
    const late = new AbortController();
    const pending = transport('/api/b', { signal: late.signal });
    late.abort(new DOMException('slow', 'TimeoutError'));
    await expect(pending).rejects.toMatchObject({ name: 'TimeoutError' });
    worker.emit({ type: 'response', id: 1, status: 200, headers: [], body: '{}' }); // no effect
  });

  it('sends text bodies only', async () => {
    const { transport } = connectDevice(new FakeWorker(), ACCOUNT);
    await expect(transport('/api/a', { method: 'POST', body: new Blob(['x']) })).rejects.toBeInstanceOf(TypeError);
  });
});

describe('the API client over the device transport', () => {
  it('works unchanged: JSON, idempotency keys, typed errors and network errors', async () => {
    const worker = new FakeWorker();
    const { transport } = connectDevice(worker, ACCOUNT);
    setTransport(transport);
    const answer = (status: number, body: unknown) => {
      const req = worker.requests().at(-1)!;
      worker.emit({ type: 'response', id: req.id, status, headers: [['content-type', 'application/json']], body: JSON.stringify(body) });
      return req;
    };

    const got = apiGet<{ profile: { a: number } }>('/profile', { tz: 'x', empty: '' });
    await flush();
    expect(answer(200, { profile: { a: 1 } })).toMatchObject({ method: 'GET', url: '/api/profile?tz=x', body: null });
    await expect(got).resolves.toEqual({ profile: { a: 1 } });

    const posted = apiPost('/nutrition/logs/quick', { kcal: 1 }, 'key-12345678');
    await flush();
    const req = answer(404, { error: { code: 'not_available_on_device', message: 'n/a' } });
    expect(req.headers).toMatchObject({ 'idempotency-key': 'key-12345678', 'content-type': 'application/json' });
    await expect(posted).rejects.toMatchObject({ status: 404, code: 'not_available_on_device' });

    const deleted = apiDelete('/account', { confirm: 'DELETE' });
    await flush();
    worker.emit({ type: 'request-failed', id: worker.requests().at(-1)!.id, message: 'x' });
    const err = await deleted.catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).code).toBe('network_error');
  });
});

describe('server mode', () => {
  it('uses fetch with exactly the arguments it always did', async () => {
    const fetchMock = vi.fn(async () => new Response('{"ok":true}', { status: 200, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
    try {
      await apiPost('/nutrition/logs/quick', { kcal: 1 }, 'key-12345678');
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
      expect(url).toBe('/api/nutrition/logs/quick');
      expect(init).toMatchObject({
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'Idempotency-Key': 'key-12345678' },
        credentials: 'same-origin',
        body: '{"kcal":1}',
      });
      expect(init.signal).toBeInstanceOf(AbortSignal);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
