/**
 * `@anthropic-ai/sdk` for device mode. AI features need an API key that must never ship inside an
 * app, so device mode runs with AI_API_KEY empty: server/src/ai/llm.ts then reports `not_configured`
 * before it would create a client, the coach answers with its built-in mode and meal-photo analysis
 * says it is unavailable. The error classes exist because llm.ts maps errors with `instanceof`.
 */
class APIError extends Error {
  readonly status: number | undefined = undefined;
  readonly headers: Headers | undefined = undefined;
}
class APIConnectionError extends APIError {}
class APIConnectionTimeoutError extends APIConnectionError {}
class AuthenticationError extends APIError {}
class PermissionDeniedError extends APIError {}
class RateLimitError extends APIError {}
class BadRequestError extends APIError {}
class NotFoundError extends APIError {}
class UnprocessableEntityError extends APIError {}

export default class Anthropic {
  static APIError = APIError;
  static APIConnectionError = APIConnectionError;
  static APIConnectionTimeoutError = APIConnectionTimeoutError;
  static AuthenticationError = AuthenticationError;
  static PermissionDeniedError = PermissionDeniedError;
  static RateLimitError = RateLimitError;
  static BadRequestError = BadRequestError;
  static NotFoundError = NotFoundError;
  static UnprocessableEntityError = UnprocessableEntityError;

  constructor(_options?: unknown) {
    throw new Error('AI is not available in device mode');
  }
}
