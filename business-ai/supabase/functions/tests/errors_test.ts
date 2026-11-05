import { assertEquals, assertInstanceOf } from '@std/assert';
import Anthropic from '@anthropic-ai/sdk';
import { AiCallError, mapProviderError } from '../_shared/ai/errors.ts';
import { AppError, fromPostgrestError, STATUS_BY_CODE, toAppError } from '../_shared/errors.ts';
import { AI_ERROR_CODES } from '../_shared/domain/ai-api.ts';
import { appErrorResponse, errorResponse } from '../_shared/http.ts';

const headers = new Headers({ 'request-id': 'req_test' });
const apiErr = (status: number, type: string) =>
  Anthropic.APIError.generate(status, { type: 'error', error: { type, message: 'x' } }, 'x', headers);

Deno.test('provider errors: typed SDK errors map to public codes', () => {
  assertEquals(mapProviderError(apiErr(429, 'rate_limit_error')).code, 'rate_limited');
  assertEquals(mapProviderError(apiErr(401, 'authentication_error')).code, 'not_configured');
  assertEquals(mapProviderError(apiErr(403, 'permission_error')).code, 'not_configured');
  assertEquals(mapProviderError(apiErr(404, 'not_found_error')).code, 'not_configured');
  assertEquals(mapProviderError(apiErr(500, 'api_error')).code, 'ai_unavailable');
  assertEquals(mapProviderError(apiErr(529, 'overloaded_error')).code, 'ai_unavailable');
  assertEquals(mapProviderError(apiErr(503, 'api_error')).code, 'ai_unavailable');
  assertEquals(mapProviderError(apiErr(408, 'timeout_error')).code, 'ai_unavailable');
  assertEquals(mapProviderError(apiErr(413, 'request_too_large')).code, 'invalid_request');
  assertEquals(mapProviderError(apiErr(400, 'invalid_request_error')).code, 'internal');
  assertEquals(mapProviderError(new Anthropic.APIConnectionError({ message: 'down' })).code, 'ai_unavailable');
  assertEquals(mapProviderError(new Anthropic.APIConnectionTimeoutError()).code, 'ai_unavailable');
  assertEquals(mapProviderError(new Anthropic.APIUserAbortError()).code, 'ai_unavailable');
  assertEquals(mapProviderError(new Error('boom')).code, 'internal');
});

Deno.test('provider errors: AppErrors pass through; usage and partial text are kept', () => {
  const app = new AppError('quota_exceeded');
  assertEquals(mapProviderError(app), app);
  const usage = { inputTokens: 1, outputTokens: 2, cacheReadTokens: 0, cacheWriteTokens: 0, costMicros: 44 };
  const mapped = mapProviderError(apiErr(529, 'overloaded_error'), { usage, partialText: 'hello' });
  assertInstanceOf(mapped, AiCallError);
  assertEquals(mapped.usage, usage);
  assertEquals(mapped.partialText, 'hello');
});

Deno.test('error codes: every public code has an HTTP status', () => {
  for (const code of AI_ERROR_CODES) assertEquals(typeof STATUS_BY_CODE[code], 'number');
  assertEquals(STATUS_BY_CODE.quota_exceeded, 429);
  assertEquals(STATUS_BY_CODE.cost_cap_reached, 429);
  assertEquals(STATUS_BY_CODE.not_configured, 503);
  assertEquals(STATUS_BY_CODE.unauthorized, 401);
});

Deno.test('postgrest errors: business-rule and SQLSTATE codes map to public codes', () => {
  const p = (code: string, message = 'x', details: string | null = null) =>
    fromPostgrestError({ code, message, details }, 'op');
  assertEquals(p('P0001', 'quota_exceeded', 'feature=plan_generation used=2 limit=2').code, 'quota_exceeded');
  assertEquals(p('P0001', 'cost_cap_reached').code, 'cost_cap_reached');
  assertEquals(p('P0001', 'not_found').code, 'not_found');
  assertEquals(p('P0001', 'forbidden').code, 'forbidden');
  assertEquals(p('P0001', 'precondition_failed').code, 'precondition_failed');
  assertEquals(p('P0001', 'plan_version_immutable').code, 'conflict');
  assertEquals(p('P0001', 'dependency_cycle').code, 'invalid_request');
  assertEquals(p('42501').code, 'forbidden');
  assertEquals(p('23514').code, 'invalid_request');
  assertEquals(p('23505').code, 'conflict');
  assertEquals(p('23503').code, 'not_found');
  assertEquals(p('PGRST116').code, 'not_found');
  assertEquals(p('XX000').code, 'internal');
  assertEquals(toAppError('weird').code, 'internal');
});

Deno.test('http: error envelope never leaks internal details', async () => {
  const err = new AppError('internal', undefined, { details: { op: 'secret_table.select', reason: 'stack' } });
  const res = appErrorResponse(err);
  assertEquals(res.status, 500);
  assertEquals(await res.json(), { error: { code: 'internal', message: 'Something went wrong.' } });

  const withPublic = new AppError('invalid_request', 'Bad', {
    details: { op: 'x', issues: [{ path: 'a', message: 'b' }] },
  });
  assertEquals(await appErrorResponse(withPublic).json(), {
    error: { code: 'invalid_request', message: 'Bad', details: { issues: [{ path: 'a', message: 'b' }] } },
  });

  const rl = appErrorResponse(new AppError('rate_limited'));
  assertEquals(rl.headers.get('retry-after'), '30');
  const plain = errorResponse('not_found');
  assertEquals(plain.status, 404);
  assertEquals((await plain.json()).error.code, 'not_found');
});
