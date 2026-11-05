/**
 * HTTP helpers shared by the Edge Functions: CORS (incl. preflight), JSON responses and the
 * `AiErrorBody` error envelope from domain/ai-api.ts.
 */
import type { AiErrorBody, AiErrorCode } from './domain/ai-api.ts';
import { AppError, STATUS_BY_CODE } from './errors.ts';

/** Bearer-token API (no cookies), so a wildcard origin is safe; restrict with CORS_ALLOWED_ORIGINS if desired. */
const BASE_CORS_HEADERS: Readonly<Record<string, string>> = Object.freeze({
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
});

/**
 * CORS headers for a request. `allowedOrigins` comes from env CORS_ALLOWED_ORIGINS (comma separated);
 * when empty every origin is allowed.
 */
export function corsHeaders(req: Request | null, allowedOrigins: readonly string[] = []): Record<string, string> {
  const headers: Record<string, string> = { ...BASE_CORS_HEADERS };
  if (allowedOrigins.length === 0) {
    headers['Access-Control-Allow-Origin'] = '*';
    return headers;
  }
  const origin = req?.headers.get('origin') ?? '';
  if (origin && allowedOrigins.includes(origin)) headers['Access-Control-Allow-Origin'] = origin;
  headers['Vary'] = 'Origin';
  return headers;
}

export function preflight(req: Request, allowedOrigins: readonly string[] = []): Response {
  return new Response(null, { status: 204, headers: corsHeaders(req, allowedOrigins) });
}

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  });
}

export function errorBody(code: AiErrorCode, message: string, details?: Record<string, unknown>): AiErrorBody {
  return details ? { error: { code, message, details } } : { error: { code, message } };
}

export function errorResponse(
  code: AiErrorCode,
  status: number = STATUS_BY_CODE[code],
  message?: string,
  headers: Record<string, string> = {},
  details?: Record<string, unknown>,
): Response {
  const err = new AppError(code, message);
  return json(errorBody(code, err.message, details), status, headers);
}

/** Public details only: internal `op` names and causes never leave the server. */
function publicDetails(err: AppError): Record<string, unknown> | undefined {
  if (!err.details) return undefined;
  const { op: _op, reason: _reason, ...rest } = err.details;
  return Object.keys(rest).length > 0 ? rest : undefined;
}

export function appErrorResponse(err: AppError, headers: Record<string, string> = {}): Response {
  const extra: Record<string, string> = { ...headers };
  if (err.code === 'rate_limited') extra['Retry-After'] = '30';
  return json(errorBody(err.code, err.message, publicDetails(err)), err.status, extra);
}

/** Maximum accepted request body (both functions take small JSON bodies). */
export const MAX_BODY_BYTES = 64 * 1024;

/** Reads and parses a JSON request body with a size limit. Throws AppError('invalid_request'). */
export async function readJsonBody(req: Request, maxBytes = MAX_BODY_BYTES): Promise<unknown> {
  const declared = Number(req.headers.get('content-length') ?? '0');
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new AppError('invalid_request', 'Request body too large.');
  }
  let text: string;
  try {
    const buf = new Uint8Array(await req.arrayBuffer());
    if (buf.byteLength > maxBytes) throw new AppError('invalid_request', 'Request body too large.');
    text = new TextDecoder().decode(buf);
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError('invalid_request', 'Could not read the request body.');
  }
  if (text.trim() === '') throw new AppError('invalid_request', 'Request body is required.');
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new AppError('invalid_request', 'Request body must be valid JSON.');
  }
}

/** Summarizes zod issues for the `details` of an invalid_request error (paths and messages only). */
export function issueDetails(
  issues: readonly { path: readonly PropertyKey[]; message: string }[],
): Record<string, unknown> {
  return {
    issues: issues.slice(0, 10).map((i) => ({ path: i.path.map((p) => String(p)).join('.'), message: i.message })),
  };
}
