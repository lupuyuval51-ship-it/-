import { NetworkError, type Transport, type TransportRequest, type TransportResponse } from './transport.ts';

/** Hosted mode: cookie session (HttpOnly) + CSRF header + Idempotency-Key, same-origin `/api`. */
export class HostedTransport implements Transport {
  csrf = '';
  async request(r: TransportRequest): Promise<TransportResponse> {
    const qs = r.query && Object.keys(r.query).length ? `?${new URLSearchParams(r.query).toString()}` : '';
    const headers: Record<string, string> = { accept: 'application/json', ...(r.headers ?? {}) };
    if (r.body !== undefined) headers['content-type'] = 'application/json';
    if (this.csrf && r.method !== 'GET') headers['x-csrf-token'] = this.csrf;
    let res: Response;
    try {
      res = await fetch(`${r.path}${qs}`, { method: r.method, credentials: 'include', headers, ...(r.body !== undefined ? { body: JSON.stringify(r.body) } : {}) });
    } catch { throw new NetworkError(); }
    const text = await res.text();
    let body: unknown = null;
    try { body = text ? JSON.parse(text) : null; } catch { body = { error: 'invalid_response' }; }
    const out: Record<string, string> = {}; res.headers.forEach((v, k) => { out[k] = v; });
    const csrf = (body as { csrfToken?: string } | null)?.csrfToken;
    if (csrf) this.csrf = csrf;
    return { status: res.status, body, headers: out };
  }
}
