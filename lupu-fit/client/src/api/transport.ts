export interface TransportRequest { method: string; path: string; query?: Record<string, string>; body?: unknown; headers?: Record<string, string> }
export interface TransportResponse { status: number; body: unknown; headers: Record<string, string> }
export interface Transport { request(req: TransportRequest): Promise<TransportResponse> }

/** Thrown for non-2xx API responses. `code` is the server's machine-readable error. */
export class ApiRequestError extends Error {
  constructor(readonly status: number, readonly code: string, readonly body: unknown, readonly headers: Record<string, string> = {}) { super(`${status} ${code}`); }
  get retryAfterSec(): number | null { const v = Number(this.headers['retry-after']); return Number.isFinite(v) && v > 0 ? v : null; }
}
/** Thrown when the network (or the device worker) is unreachable; callers may queue the mutation for replay. */
export class NetworkError extends Error { constructor(message = 'network_error') { super(message); } }
