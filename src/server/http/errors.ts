/** Error that is safe to show to API clients. Anything else becomes a generic 500. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
    public readonly headers?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const Errors = {
  badRequest: (message = "Bad request", details?: unknown) => new ApiError(400, "BAD_REQUEST", message, details),
  validation: (details: unknown) => new ApiError(400, "VALIDATION_ERROR", "The request is invalid.", details),
  unauthorized: () => new ApiError(401, "UNAUTHORIZED", "Please sign in to continue."),
  forbidden: (message = "You do not have access to this resource.", code = "FORBIDDEN") => new ApiError(403, code, message),
  notFound: (message = "Not found.") => new ApiError(404, "NOT_FOUND", message),
  conflict: (code: string, message: string, details?: unknown) => new ApiError(409, code, message, details),
  tooMany: (retryAfterSec: number) =>
    new ApiError(429, "RATE_LIMITED", "Too many requests. Please slow down and try again shortly.", undefined, {
      "Retry-After": String(Math.max(1, Math.ceil(retryAfterSec))),
    }),
  unavailable: (code: string, message: string) => new ApiError(503, code, message),
  payment: (code: string, message: string) => new ApiError(402, code, message),
};
