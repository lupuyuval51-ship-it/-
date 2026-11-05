/**
 * Mapping of Anthropic SDK errors and response conditions onto the public AiErrorCode contract.
 */
import Anthropic from '@anthropic-ai/sdk';
import { AppError } from '../errors.ts';
import type { AiErrorCode } from '../domain/ai-api.ts';
import type { UsageTotals } from './pricing.ts';

/**
 * An AppError raised by an AI call that may already have consumed tokens (refusal, truncated or
 * invalid output, mid-stream failure). The usage is recorded on the reservation before rethrowing.
 */
export class AiCallError extends AppError {
  readonly usage: UsageTotals | null;
  /** Text already produced before the failure (advisor streaming). */
  readonly partialText: string;

  constructor(
    code: AiErrorCode,
    message?: string,
    options?: { usage?: UsageTotals | null; partialText?: string; details?: Record<string, unknown>; cause?: unknown },
  ) {
    super(code, message, { details: options?.details, cause: options?.cause });
    this.name = 'AiCallError';
    this.usage = options?.usage ?? null;
    this.partialText = options?.partialText ?? '';
  }
}

/**
 * Typed SDK errors → public codes. Most specific first:
 * - RateLimitError (429)                 → rate_limited
 * - AuthenticationError / PermissionDenied → not_configured (bad or unauthorized API key)
 * - NotFoundError (unknown model / base URL) → not_configured
 * - APIConnectionError (incl. timeout), 408/409, 5xx/529 → ai_unavailable
 * - 413 (request too large)              → invalid_request
 * - BadRequestError (400) / other        → internal (logged: it is our bug, not the user's)
 */
export function mapProviderError(err: unknown, partial?: { usage?: UsageTotals | null; partialText?: string }): AppError {
  if (err instanceof AppError) return err;
  const opts = { usage: partial?.usage ?? null, partialText: partial?.partialText ?? '', cause: err };
  if (err instanceof Anthropic.APIUserAbortError) {
    return new AiCallError('ai_unavailable', 'The AI request was cancelled.', opts);
  }
  if (err instanceof Anthropic.APIConnectionError) {
    return new AiCallError('ai_unavailable', undefined, opts);
  }
  if (err instanceof Anthropic.RateLimitError) return new AiCallError('rate_limited', undefined, opts);
  if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
    return new AiCallError('not_configured', undefined, opts);
  }
  if (err instanceof Anthropic.NotFoundError) return new AiCallError('not_configured', undefined, opts);
  if (err instanceof Anthropic.InternalServerError) return new AiCallError('ai_unavailable', undefined, opts);
  if (err instanceof Anthropic.APIError) {
    const status = err.status ?? 0;
    if (status === 408 || status === 409 || status >= 500) return new AiCallError('ai_unavailable', undefined, opts);
    if (status === 413) return new AiCallError('invalid_request', 'The request is too large for the AI.', opts);
    // BadRequestError and anything else: our request was wrong → internal (the cause is logged).
    return new AiCallError('internal', undefined, opts);
  }
  return new AiCallError('internal', undefined, opts);
}
