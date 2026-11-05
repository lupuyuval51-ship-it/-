import type { AdvisorEvent } from '@domain/ai-api';
import { toAppError } from '@/lib/errors';
import { streamAdvisor } from '../sse';
import type { StreamingFetch, StreamingResponse } from '../streamFetch.types';

jest.mock('@/lib/functions', () => ({
  authHeaders: jest.fn(async () => ({ Authorization: 'Bearer test', apikey: 'anon' })),
  getFunctionsUrl: () => 'http://localhost/functions/v1',
}));
jest.mock('../streamFetch', () => ({ streamingFetch: jest.fn() }));

const encoder = new TextEncoder();

/** A response whose body yields the given byte chunks (optionally failing with `failWith`). */
function streamResponse(chunks: Uint8Array[], opts: { status?: number; signal?: AbortSignal; hang?: boolean } = {}): StreamingResponse {
  let index = 0;
  const reader = {
    read: () =>
      new Promise<{ value?: Uint8Array; done: boolean }>((resolve, reject) => {
        if (opts.signal?.aborted) {
          reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
          return;
        }
        if (index < chunks.length) {
          resolve({ value: chunks[index++], done: false });
          return;
        }
        if (opts.hang) {
          opts.signal?.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
          return;
        }
        resolve({ done: true });
      }),
    cancel: jest.fn(async () => undefined),
    releaseLock: jest.fn(),
  };
  return {
    ok: (opts.status ?? 200) < 400,
    status: opts.status ?? 200,
    headers: { get: () => 'text/event-stream' },
    body: { getReader: () => reader } as unknown as ReadableStream<Uint8Array>,
    text: async () => '',
  };
}

function bytesSplitEvery(text: string, size: number): Uint8Array[] {
  const bytes = encoder.encode(text);
  const out: Uint8Array[] = [];
  for (let i = 0; i < bytes.length; i += size) out.push(bytes.subarray(i, i + size));
  return out;
}

const REQUEST = { businessId: '00000000-0000-4000-8000-000000000001', message: 'שלום', locale: 'he' as const };

const HAPPY =
  'event: meta\r\ndata: {"conversationId":"c1","userMessageId":"u1"}\r\n\r\n' +
  ': keep-alive\r\n\r\n' +
  'event: delta\r\ndata: {"text":"מחיר "}\r\n\r\n' +
  'event: delta\r\ndata: {"text":"הוגן"}\r\n\r\n' +
  'event: actions\r\ndata: {"actions":[],"followUps":["ומה עם מבצעים?"]}\r\n\r\n' +
  'event: done\r\ndata: {"assistantMessageId":"a1"}\r\n\r\n';

describe('streamAdvisor', () => {
  it('streams events in order across arbitrary byte boundaries', async () => {
    for (const size of [1, 3, 7, 64]) {
      const events: AdvisorEvent[] = [];
      const fetchImpl = jest.fn<ReturnType<StreamingFetch>, Parameters<StreamingFetch>>(async () => streamResponse(bytesSplitEvery(HAPPY, size)));
      const outcome = await streamAdvisor(REQUEST, { onEvent: (e) => events.push(e), fetchImpl });
      expect(outcome).toEqual({ status: 'done', assistantMessageId: 'a1' });
      expect(events.map((e) => e.event)).toEqual(['meta', 'delta', 'delta', 'actions', 'done']);
      expect(events.filter((e) => e.event === 'delta').map((e) => (e.event === 'delta' ? e.data.text : '')).join('')).toBe('מחיר הוגן');

      const [url, init] = fetchImpl.mock.calls[0]!;
      expect(url).toBe('http://localhost/functions/v1/advisor');
      expect(init.method).toBe('POST');
      expect(init.headers).toMatchObject({ Authorization: 'Bearer test', apikey: 'anon', 'content-type': 'application/json' });
      expect(JSON.parse(init.body)).toEqual(REQUEST);
    }
  });

  it('maps AiErrorBody HTTP errors to AppError codes', async () => {
    const cases: [number, string][] = [
      [429, 'quota_exceeded'],
      [429, 'cost_cap_reached'],
      [503, 'not_configured'],
      [429, 'rate_limited'],
      [502, 'ai_unavailable'],
      [422, 'ai_refused'],
    ];
    for (const [status, code] of cases) {
      const fetchImpl: StreamingFetch = async () => ({
        ...streamResponse([], { status }),
        text: async () => JSON.stringify({ error: { code, message: 'x' } }),
      });
      await expect(streamAdvisor(REQUEST, { onEvent: () => undefined, fetchImpl })).rejects.toMatchObject({
        appError: { code, status },
      });
    }
  });

  it('falls back to the HTTP status when the body is not an AiErrorBody', async () => {
    const fetchImpl: StreamingFetch = async () => ({ ...streamResponse([], { status: 503 }), text: async () => '<html>' });
    const error = await streamAdvisor(REQUEST, { onEvent: () => undefined, fetchImpl }).catch((e: unknown) => e);
    expect(toAppError(error).code).toBe('ai_unavailable');
  });

  it('rejects with the in-stream error code', async () => {
    const body = 'event: meta\ndata: {"conversationId":"c1","userMessageId":"u1"}\n\nevent: error\ndata: {"code":"ai_refused","message":"no"}\n\n';
    const events: AdvisorEvent[] = [];
    const error = await streamAdvisor(REQUEST, {
      onEvent: (e) => events.push(e),
      fetchImpl: async () => streamResponse([encoder.encode(body)]),
    }).catch((e: unknown) => e);
    expect(toAppError(error).code).toBe('ai_refused');
    expect(events.map((e) => e.event)).toEqual(['meta']);
  });

  it('rejects with ai_unavailable when the stream ends without done', async () => {
    const body = 'event: delta\ndata: {"text":"partial"}\n\n';
    const error = await streamAdvisor(REQUEST, { onEvent: () => undefined, fetchImpl: async () => streamResponse([encoder.encode(body)]) }).catch(
      (e: unknown) => e,
    );
    expect(toAppError(error).code).toBe('ai_unavailable');
  });

  it('maps transport failures to network', async () => {
    const error = await streamAdvisor(REQUEST, {
      onEvent: () => undefined,
      fetchImpl: async () => {
        throw new TypeError('Network request failed');
      },
    }).catch((e: unknown) => e);
    expect(toAppError(error).code).toBe('network');
  });

  it('resolves as aborted when the caller aborts mid-stream', async () => {
    const controller = new AbortController();
    const events: AdvisorEvent[] = [];
    const fetchImpl: StreamingFetch = async (_url, init) =>
      streamResponse([encoder.encode('event: delta\ndata: {"text":"a"}\n\n')], { signal: init.signal, hang: true });
    const promise = streamAdvisor(REQUEST, {
      signal: controller.signal,
      onEvent: (e) => {
        events.push(e);
        controller.abort();
      },
      fetchImpl,
    });
    await expect(promise).resolves.toEqual({ status: 'aborted' });
    expect(events).toHaveLength(1);
  });

  it('times out an idle stream as ai_unavailable', async () => {
    const fetchImpl: StreamingFetch = async (_url, init) => streamResponse([], { signal: init.signal, hang: true });
    const error = await streamAdvisor(REQUEST, { onEvent: () => undefined, fetchImpl, idleTimeoutMs: 20 }).catch((e: unknown) => e);
    expect(toAppError(error).code).toBe('ai_unavailable');
  });

  it('falls back to text() when the body is not streamable', async () => {
    const events: AdvisorEvent[] = [];
    const fetchImpl: StreamingFetch = async () => ({ ...streamResponse([]), body: null, text: async () => HAPPY });
    await expect(streamAdvisor(REQUEST, { onEvent: (e) => events.push(e), fetchImpl })).resolves.toEqual({ status: 'done', assistantMessageId: 'a1' });
    expect(events).toHaveLength(5);
  });
});
