/**
 * SSE client for the advisor Edge Function (`POST {functionsUrl}/advisor`, text/event-stream).
 * Contract: AdvisorRequestSchema / AdvisorEvent in @domain/ai-api — meta → delta* → actions → done,
 * or error.
 *
 * - Streams with `expo/fetch` on native and the browser fetch on web (./streamFetch*.ts).
 * - Decodes UTF-8 incrementally and parses frames split across chunks (./sseParser.ts).
 * - Abortable (AbortSignal); an abort resolves with `{ status: 'aborted' }` instead of throwing.
 * - HTTP errors (AiErrorBody JSON) and in-stream `error` events reject with AppErrorException
 *   carrying the AI error code (quota_exceeded, cost_cap_reached, not_configured, rate_limited,
 *   ai_unavailable, ai_refused, …). A stream that ends without `done` rejects with ai_unavailable.
 */
import { AI_ERROR_CODES, type AdvisorEvent, type AdvisorRequest, type AiErrorCode } from '@domain/ai-api';
import { AppErrorException, makeAppError, toAppError, type AppError } from '@/lib/errors';
import { authHeaders, getFunctionsUrl } from '@/lib/functions';
import { parseAdvisorFrame } from './events';
import { createSseParser, createUtf8Decoder } from './sseParser';
import { streamingFetch } from './streamFetch';
import type { StreamingFetch, StreamingResponse } from './streamFetch.types';

export type StreamOutcome = { status: 'done'; assistantMessageId: string } | { status: 'aborted' };

export interface StreamAdvisorOptions {
  /** Abort to stop the reply (the Stop button). */
  signal?: AbortSignal;
  /** Called synchronously for meta, delta, actions and done, in stream order. */
  onEvent: (event: Exclude<AdvisorEvent, { event: 'error' }>) => void;
  /** Ends the request when no bytes arrive for this long (default 90 s). */
  idleTimeoutMs?: number;
  /** Test seams. */
  fetchImpl?: StreamingFetch;
  getHeaders?: () => Promise<Record<string, string>>;
  baseUrl?: string;
}

const AI_CODES: ReadonlySet<string> = new Set(AI_ERROR_CODES);
const DEFAULT_IDLE_TIMEOUT_MS = 90_000;

function isAbortError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { name?: unknown }).name === 'AbortError';
}

/** Maps a non-2xx response (ideally an AiErrorBody) to an AppError. */
export async function httpErrorFrom(response: StreamingResponse): Promise<AppError> {
  let text = '';
  try {
    text = await response.text();
  } catch {
    // ignore — fall back to the status
  }
  try {
    const body = JSON.parse(text) as { error?: { code?: unknown; message?: unknown } };
    const code = body?.error?.code;
    if (typeof code === 'string' && AI_CODES.has(code)) {
      return makeAppError(code as AiErrorCode, typeof body.error?.message === 'string' ? body.error.message : code, response.status);
    }
  } catch {
    // not JSON
  }
  return toAppError({ message: `HTTP ${response.status}`, status: response.status });
}

export async function streamAdvisor(request: AdvisorRequest, options: StreamAdvisorOptions): Promise<StreamOutcome> {
  const { signal, onEvent } = options;
  const fetchImpl = options.fetchImpl ?? streamingFetch;
  const idleTimeoutMs = options.idleTimeoutMs ?? DEFAULT_IDLE_TIMEOUT_MS;
  if (signal?.aborted) return { status: 'aborted' };

  const headers = await (options.getHeaders ?? authHeaders)();
  const url = `${options.baseUrl ?? getFunctionsUrl()}/advisor`;

  // One internal controller combines the caller's signal and the idle timeout.
  const controller = new AbortController();
  let timedOut = false;
  let idleTimer: ReturnType<typeof setTimeout> | null = null;
  const armIdle = () => {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, idleTimeoutMs);
  };
  const onCallerAbort = () => controller.abort();
  signal?.addEventListener('abort', onCallerAbort);

  const cleanup = () => {
    if (idleTimer) clearTimeout(idleTimer);
    signal?.removeEventListener('abort', onCallerAbort);
  };
  const aborted = () => signal?.aborted === true && !timedOut;
  const timeoutError = () => new AppErrorException(makeAppError('ai_unavailable', 'Advisor stream timed out'));

  let response: StreamingResponse;
  try {
    armIdle();
    response = await fetchImpl(url, {
      method: 'POST',
      headers: { ...headers, 'content-type': 'application/json', accept: 'text/event-stream' },
      body: JSON.stringify(request),
      signal: controller.signal,
    });
  } catch (error) {
    cleanup();
    if (aborted()) return { status: 'aborted' };
    if (timedOut) throw timeoutError();
    const appError = toAppError(error);
    throw new AppErrorException(appError.code === 'unknown' || isAbortError(error) ? makeAppError('network', appError.message) : appError);
  }

  if (!response.ok) {
    cleanup();
    throw new AppErrorException(await httpErrorFrom(response));
  }

  // Mutated from the parser callback (an object, so control-flow narrowing doesn't go stale).
  const result: { done: string | null; error: AppError | null; callbackError: unknown } = {
    done: null,
    error: null,
    callbackError: null,
  };
  const finished = () => result.done !== null || result.error !== null || result.callbackError !== null;

  const parser = createSseParser((frame) => {
    if (finished()) return;
    const event = parseAdvisorFrame(frame);
    if (!event) return;
    if (event.event === 'error') {
      result.error = makeAppError(event.data.code, event.data.message);
      return;
    }
    if (event.event === 'done') result.done = event.data.assistantMessageId;
    try {
      onEvent(event);
    } catch (error) {
      result.callbackError = error ?? new Error('onEvent failed');
    }
  });
  const decoder = createUtf8Decoder();

  try {
    const body = response.body;
    if (body && typeof body.getReader === 'function') {
      const reader = body.getReader();
      try {
        while (!finished()) {
          const { value, done: eof } = await reader.read();
          if (eof) break;
          armIdle();
          if (value && value.byteLength > 0) parser.push(decoder.decode(value));
        }
      } finally {
        if (finished()) reader.cancel().catch(() => undefined);
        try {
          reader.releaseLock();
        } catch {
          // already released / errored
        }
      }
    } else {
      // Runtime without streaming bodies: still correct, just not progressive.
      parser.push(await response.text());
    }
    parser.push(decoder.flush());
    parser.end();
  } catch (error) {
    cleanup();
    if (aborted()) return { status: 'aborted' };
    if (timedOut) throw timeoutError();
    if (!finished()) throw new AppErrorException(makeAppError('network', error instanceof Error ? error.message : 'Stream failed'));
  }
  cleanup();

  if (result.callbackError !== null) throw result.callbackError;
  if (result.error) throw new AppErrorException(result.error);
  if (result.done !== null) return { status: 'done', assistantMessageId: result.done };
  if (aborted()) return { status: 'aborted' };
  throw new AppErrorException(makeAppError('ai_unavailable', 'Advisor stream ended before "done"'));
}
