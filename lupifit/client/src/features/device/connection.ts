/**
 * The page's side of device mode: talks to the device worker (the server inside the app).
 * - `transport` has fetch's shape for what `api/client.ts` sends (method, headers, string body, signal)
 *   and resolves with a real `Response`, so the API client works unchanged.
 * - The boot state (booting / locked / ready / failed) is an external store for `DeviceGate`.
 * No server code is imported here: only the message types.
 */
import type { BootState, InitMessage, PageMessage, WorkerMessage } from '../../device/worker/protocol';
import type { Transport } from '../../api/client';

export interface WorkerLike {
  postMessage(message: PageMessage): void;
  addEventListener(type: 'message', listener: (event: MessageEvent<WorkerMessage>) => void): void;
  addEventListener(type: 'error', listener: (event: Event) => void): void;
}

export interface DeviceConnection {
  transport: Transport;
  getState(): BootState;
  subscribe(listener: () => void): () => void;
}

/** Statuses whose Response must not have a body (the Response constructor throws otherwise). */
const NULL_BODY = new Set([101, 103, 204, 205, 304]);

function headerRecord(headers: HeadersInit | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!headers) return out;
  new Headers(headers).forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

const abortReason = (signal: AbortSignal) => signal.reason ?? new DOMException('The operation was aborted.', 'AbortError');

export function connectDevice(worker: WorkerLike, account: InitMessage['account']): DeviceConnection {
  let state: BootState = { state: 'booting', step: 'database', firstLaunch: false };
  const listeners = new Set<() => void>();
  const setState = (next: BootState) => {
    state = next;
    for (const l of listeners) l();
  };
  let nextId = 1;
  const waiting = new Map<number, { resolve(res: Response): void; reject(err: unknown): void }>();

  worker.addEventListener('message', (event) => {
    const msg = event.data;
    if (msg.type === 'state') return setState(msg.boot);
    const entry = waiting.get(msg.id);
    if (!entry) return; // aborted meanwhile
    waiting.delete(msg.id);
    if (msg.type === 'request-failed') return entry.reject(new TypeError('Failed to fetch'));
    const body = NULL_BODY.has(msg.status) ? null : (msg.body as BodyInit | null);
    entry.resolve(new Response(body, { status: msg.status, headers: msg.headers }));
  });
  worker.addEventListener('error', () => {
    // The worker script itself could not load or crashed.
    if (state.state !== 'failed') setState({ state: 'failed', reason: 'unknown', detail: 'The device worker stopped' });
    for (const entry of waiting.values()) entry.reject(new TypeError('Failed to fetch'));
    waiting.clear();
  });
  worker.postMessage({ type: 'init', account });

  const transport: Transport = (url, init = {}) =>
    new Promise<Response>((resolve, reject) => {
      const signal = init.signal ?? undefined;
      if (signal?.aborted) return reject(abortReason(signal));
      const body = init.body ?? null;
      if (body !== null && typeof body !== 'string') return reject(new TypeError('Device mode sends text bodies only'));
      const id = nextId++;
      waiting.set(id, { resolve, reject });
      signal?.addEventListener(
        'abort',
        () => {
          // Like fetch: the caller stops waiting; the worker still finishes the request (as a server would).
          if (waiting.delete(id)) reject(abortReason(signal));
        },
        { once: true },
      );
      worker.postMessage({ type: 'request', id, method: (init.method ?? 'GET').toUpperCase(), url: String(url), headers: headerRecord(init.headers), body });
    });

  return {
    transport,
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
