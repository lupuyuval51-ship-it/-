import { IS_DEVICE } from '../env.ts';
import { wipeUserLocalState } from '../lib/userState.ts';
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

/* ---- who is signed in --------------------------------------------------------------------------------------------------------------
 * Several people can use one browser or phone. The API layer is the one place that sees every sign-in, sign-out and /api/auth/me
 * answer, so it keeps track of the current user id and tells the rest of the app when the person changes: per-person local data is
 * wiped, the query cache is emptied and the offline outbox stops handling the previous person's items. */
const LAST_USER_KEY = 'lf_last_uid';
export type UserChange = { from: string | null; to: string | null; reason: 'signin' | 'switch' | 'signout' | 'deleted' };
let currentUserId: string | null = null;
const userListeners = new Set<(e: UserChange) => void>();
export const getCurrentUserId = (): string | null => currentUserId;
/** Called for every change of person (including sign-in, which can also be the first of the session). Returns an unsubscribe. */
export function onUserChange(fn: (e: UserChange) => void): () => void { userListeners.add(fn); return () => { userListeners.delete(fn); }; }
const lastSeen = (): string | null => { try { return localStorage.getItem(LAST_USER_KEY); } catch { return null; } };
const remember = (id: string | null): void => { try { if (id) localStorage.setItem(LAST_USER_KEY, id); else localStorage.removeItem(LAST_USER_KEY); } catch { /* storage unavailable */ } };
function emit(e: UserChange): void { for (const l of [...userListeners]) { try { l(e); } catch { /* a listener must not break the request */ } } }

function userSeen(id: string, signIn: boolean): void {
  const before = currentUserId;
  const prev = before ?? lastSeen();
  const switched = prev !== null && prev !== id;
  if (switched) wipeUserLocalState(); // the previous person left things on this device (session expired, cookie lost): none of it is for this one
  currentUserId = id; remember(id);
  if (switched || signIn || before !== id) emit({ from: prev, to: id, reason: switched ? 'switch' : 'signin' });
}
/** Session ended on the server side (401) without a sign-out: nothing to wipe (the same person may come back), but nothing may be sent for them either. */
function userGone(reason: 'signout' | 'deleted' | null): void {
  const from = currentUserId ?? lastSeen();
  if (reason) { wipeUserLocalState(); if (reason === 'deleted') remember(null); }
  if (currentUserId === null && !reason) return;
  currentUserId = null;
  emit({ from, to: null, reason: reason ?? 'signout' });
}
function noteIdentity(method: string, path: string, status: number, body: unknown): void {
  if (status === 401 && path === '/api/auth/me') { userGone(null); return; }
  if (status >= 400) return;
  if (method === 'POST' && path === '/api/auth/logout') { userGone('signout'); return; }
  if (method === 'DELETE' && path === '/api/account') { userGone('deleted'); return; }
  const id = (body as { user?: { id?: unknown } } | null)?.user?.id;
  if (typeof id !== 'string') return;
  if (path === '/api/auth/login' || path === '/api/auth/register') userSeen(id, true);
  else if (method === 'GET' && path === '/api/auth/me') userSeen(id, false);
}

export interface CallOpts { query?: Record<string, string | number | undefined>; idempotencyKey?: string }
const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

async function call<T>(method: string, path: string, body?: unknown, opts: CallOpts = {}): Promise<T> {
  const query: Record<string, string> = {};
  for (const [k, v] of Object.entries(opts.query ?? {})) if (v !== undefined) query[k] = String(v);
  const headers: Record<string, string> = {};
  if (MUTATING.has(method)) headers['idempotency-key'] = opts.idempotencyKey ?? crypto.randomUUID();
  const res = await getTransport().request({ method, path, query, body, headers });
  noteIdentity(method, path, res.status, res.body);
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
