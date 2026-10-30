/**
 * Fetch wrapper for the LUPU-FIT API.
 * - Same-origin cookies (HttpOnly session) + `X-CSRF-Token` on mutations.
 * - Typed `ApiError` with stable `code` (maps to i18n `errors.<code>`).
 * - Timeouts and network failures become `network_error` / `timeout`.
 * - Optional `Idempotency-Key` for duplicate-safe submissions.
 * - One automatic retry after refreshing the CSRF token.
 */
import type { ApiErrorBody, MeResponse } from '@shared/types';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** Field → message code map from a `validation_error` response. */
  get fieldErrors(): Record<string, string> {
    const issues = (this.details as { issues?: { path: string; message: string }[] } | undefined)?.issues ?? [];
    const out: Record<string, string> = {};
    for (const i of issues) if (!(i.path in out)) out[i.path] = i.message;
    return out;
  }

  get isNetwork() {
    return this.code === 'network_error' || this.code === 'timeout';
  }
}

let csrfToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function setCsrfToken(token: string | null) {
  csrfToken = token;
}

export function onUnauthorized(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

export interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | null | undefined>;
  idempotencyKey?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
}

function buildUrl(path: string, query?: ApiOptions['query']): string {
  const url = path.startsWith('/api') ? path : `/api${path.startsWith('/') ? '' : '/'}${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

async function refreshCsrf(): Promise<void> {
  const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
  if (res.ok) {
    const me = (await res.json()) as MeResponse;
    csrfToken = me.csrfToken;
  }
}

async function doFetch(path: string, opts: ApiOptions): Promise<Response> {
  const method = opts.method ?? 'GET';
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (method !== 'GET' && csrfToken) headers['X-CSRF-Token'] = csrfToken;
  if (opts.idempotencyKey) headers['Idempotency-Key'] = opts.idempotencyKey;
  const timeout = AbortSignal.timeout(opts.timeoutMs ?? 20_000);
  const signal = opts.signal ? AbortSignal.any([opts.signal, timeout]) : timeout;
  try {
    return await fetch(buildUrl(path, opts.query), {
      method,
      headers,
      credentials: 'same-origin',
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal,
    });
  } catch (err) {
    if (opts.signal?.aborted) throw err;
    if (timeout.aborted) throw new ApiError(0, 'timeout', 'Request timed out');
    throw new ApiError(0, 'network_error', 'Network error');
  }
}

export async function api<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  let res = await doFetch(path, opts);
  if (res.status === 403) {
    const peek = (await res.clone().json().catch(() => null)) as ApiErrorBody | null;
    if (peek?.error?.code === 'csrf_invalid') {
      await refreshCsrf();
      res = await doFetch(path, opts);
    }
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }
  if (!res.ok) {
    const err = (data as ApiErrorBody | null)?.error;
    if (res.status === 401 && !path.includes('/auth/')) unauthorizedHandler?.();
    throw new ApiError(res.status, err?.code ?? (res.status >= 500 ? 'internal_error' : 'generic'), err?.message ?? res.statusText, err?.details, err?.requestId);
  }
  return data as T;
}

export const apiGet = <T>(path: string, query?: ApiOptions['query'], signal?: AbortSignal) => api<T>(path, { query, signal });
export const apiPost = <T>(path: string, body?: unknown, idempotencyKey?: string, timeoutMs?: number) =>
  api<T>(path, { method: 'POST', body: body ?? {}, idempotencyKey, timeoutMs });
export const apiPut = <T>(path: string, body?: unknown, idempotencyKey?: string) => api<T>(path, { method: 'PUT', body: body ?? {}, idempotencyKey });
export const apiPatch = <T>(path: string, body?: unknown, idempotencyKey?: string) => api<T>(path, { method: 'PATCH', body: body ?? {}, idempotencyKey });
export const apiDelete = <T>(path: string, body?: unknown) => api<T>(path, { method: 'DELETE', body });
