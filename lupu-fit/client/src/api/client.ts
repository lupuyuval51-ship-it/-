import { IS_DEVICE } from '../env.ts';
import { DeviceTransport } from './device.ts';
import { HostedTransport } from './hosted.ts';
import { ApiRequestError, type Transport } from './transport.ts';

export { ApiRequestError, NetworkError } from './transport.ts';

let transport: Transport | null = null;
export function setTransport(t: Transport): void { transport = t; }
export function getTransport(): Transport {
  if (!transport) transport = IS_DEVICE ? (() => { throw new Error('device transport not initialised'); })() : new HostedTransport();
  return transport;
}
export function createDeviceTransport(worker: Worker): DeviceTransport { const t = new DeviceTransport(worker); transport = t; return t; }

export interface CallOpts { query?: Record<string, string | number | undefined>; idempotencyKey?: string }
const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

async function call<T>(method: string, path: string, body?: unknown, opts: CallOpts = {}): Promise<T> {
  const query: Record<string, string> = {};
  for (const [k, v] of Object.entries(opts.query ?? {})) if (v !== undefined) query[k] = String(v);
  const headers: Record<string, string> = {};
  if (MUTATING.has(method)) headers['idempotency-key'] = opts.idempotencyKey ?? crypto.randomUUID();
  const res = await getTransport().request({ method, path, query, body, headers });
  if (res.status >= 400) throw new ApiRequestError(res.status, (res.body as { error?: string } | null)?.error ?? 'error', res.body, res.headers);
  return res.body as T;
}

/** Typed JSON client. Mutations carry an Idempotency-Key automatically (pass your own to make a retry replay-safe). */
export const api = {
  get: <T>(path: string, query?: CallOpts['query']) => call<T>('GET', path, undefined, query ? { query } : {}),
  post: <T>(path: string, body?: unknown, o?: CallOpts) => call<T>('POST', path, body ?? {}, o),
  put: <T>(path: string, body?: unknown, o?: CallOpts) => call<T>('PUT', path, body ?? {}, o),
  patch: <T>(path: string, body?: unknown, o?: CallOpts) => call<T>('PATCH', path, body ?? {}, o),
  delete: <T>(path: string, body?: unknown, o?: CallOpts) => call<T>('DELETE', path, body, o),
};
