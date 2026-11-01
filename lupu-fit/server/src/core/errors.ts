export class ApiError extends Error {
  constructor(readonly status: number, readonly code: string, readonly extra?: Record<string, unknown>, readonly headers?: Record<string, string>) { super(code); }
}
export const notFound = (what = 'not_found'): ApiError => new ApiError(404, what);
export const badRequest = (code = 'bad_request', extra?: Record<string, unknown>): ApiError => new ApiError(400, code, extra);
export const unauthorized = (code = 'unauthorized'): ApiError => new ApiError(401, code);
