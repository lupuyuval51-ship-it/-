/**
 * HTTP error model. Throw `HttpError` (or a helper) from any route/service; the error
 * middleware turns it into `{ error: { code, message, details, requestId } }`.
 * `code` is stable and maps to client i18n key `errors.<code>`.
 */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message?: string,
    public readonly details?: unknown,
    public readonly headers?: Record<string, string>,
  ) {
    super(message ?? code);
    this.name = 'HttpError';
  }
}

export const badRequest = (code = 'bad_request', message?: string, details?: unknown) => new HttpError(400, code, message, details);
export const unauthorized = (code = 'unauthorized', message = 'Authentication required') => new HttpError(401, code, message);
export const forbidden = (code = 'forbidden', message = 'Not allowed') => new HttpError(403, code, message);
export const notFound = (code = 'not_found', message = 'Not found') => new HttpError(404, code, message);
export const conflict = (code = 'conflict', message?: string, details?: unknown) => new HttpError(409, code, message, details);
export const unprocessable = (code: string, message?: string, details?: unknown) => new HttpError(422, code, message, details);
export const tooManyRequests = (retryAfterSeconds: number, code = 'rate_limited') =>
  new HttpError(429, code, 'Too many requests, please slow down', { retryAfterSeconds }, { 'Retry-After': String(Math.max(1, Math.ceil(retryAfterSeconds))) });
export const serviceUnavailable = (code = 'service_unavailable', message?: string) => new HttpError(503, code, message);
export const badGateway = (code = 'upstream_error', message?: string) => new HttpError(502, code, message);
