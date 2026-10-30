import type { NextFunction, Request, Response } from 'express';
import { NoRowError, PG, pgErrorCode } from '../db/pool';
import { HttpError, badRequest, conflict, notFound } from '../lib/errors';

export function apiNotFound(req: Request, _res: Response, next: NextFunction) {
  next(notFound('route_not_found', `No route for ${req.method} ${req.path}`));
}

function toHttpError(err: unknown): HttpError {
  if (err instanceof HttpError) return err;
  if (err instanceof NoRowError) return notFound();
  const e = err as { type?: string; status?: number } | null;
  if (e?.type === 'entity.parse.failed') return badRequest('invalid_json', 'Malformed JSON body');
  if (e?.type === 'entity.too.large') return new HttpError(413, 'payload_too_large', 'Request body too large');
  if (e?.type === 'encoding.unsupported' || e?.type === 'charset.unsupported') return new HttpError(415, 'unsupported_media_type');
  switch (pgErrorCode(err)) {
    case PG.uniqueViolation:
      return conflict('duplicate', 'Resource already exists');
    case PG.foreignKeyViolation:
      return badRequest('invalid_reference', 'Referenced resource does not exist');
    case PG.checkViolation:
    case PG.notNullViolation:
      return badRequest('constraint_violation', 'Value out of allowed range');
    case PG.invalidTextRepresentation:
      return badRequest('invalid_input', 'Malformed identifier or value');
  }
  return new HttpError(500, 'internal_error', 'Something went wrong. Please try again.');
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (res.headersSent) return next(err);
  const httpErr = toHttpError(err);
  if (httpErr.status >= 500) {
    console.error(`[error] ${req.method} ${req.path} rid=${req.requestId}`, err);
  }
  if (httpErr.headers) for (const [k, v] of Object.entries(httpErr.headers)) res.setHeader(k, v);
  res.status(httpErr.status).json({
    error: {
      code: httpErr.code,
      message: httpErr.message,
      ...(httpErr.details !== undefined ? { details: httpErr.details } : {}),
      requestId: req.requestId,
    },
  });
}
