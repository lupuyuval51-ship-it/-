import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_STREAM_DEADLINE_MS, DirectorError, STREAM_DEADLINE_MARGIN_MS, STREAM_IDLE_MS, fetchDirectorStatus, requestEpisode, type DirectorEvent } from '../src/ai/client.ts';
import { aiEpisodeToAdventure } from '../shared/aiEpisode.ts';
import type { Prefs } from '../shared/types.ts';
import { mockAiEpisode } from './fixtures/aiEpisode.ts';

const prefs: Prefs = { minutes: 30, budget: 0, setting: 'outside', company: 'solo', mood: 'curious', weirdness: 2 };
const adventure = aiEpisodeToAdventure(mockAiEpisode(30), prefs).adventure;

function sseResponse(events: unknown[], chunkSize = 37): Response {
  const text = ': hello\n\n' + events.map((e) => `event: ${(e as { type: string }).type}\ndata: ${JSON.stringify(e)}\n\n`).join('');
  const bytes = new TextEncoder().encode(text);
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // Deliberately awkward chunk boundaries (mid-event, mid-UTF-8 sequence).
      for (let i = 0; i < bytes.length; i += chunkSize) controller.enqueue(bytes.slice(i, i + chunkSize));
      controller.close();
    },
  });
  return new Response(stream, { status: 200, headers: { 'content-type': 'text/event-stream' } });
}

afterEach(() => vi.unstubAllGlobals());

describe('requestEpisode', () => {
  it('parses a chunked SSE stream and returns a validated adventure', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => sseResponse([
      { type: 'phase', phase: 'plotting' },
      { type: 'title', title: 'The Borrowed Postcard — “quoted” ✶' },
      { type: 'progress', chars: 3000, expected: 6500 },
      { type: 'episode', adventure, model: 'claude-opus-5-5', repaired: false },
    ])));
    const seen: DirectorEvent[] = [];
    const result = await requestEpisode({ prefs }, { onEvent: (e) => seen.push(e) });
    expect(result.title).toBe('The Borrowed Postcard');
    expect(seen.map((e) => e.type)).toEqual(['phase', 'title', 'progress', 'episode']);
    expect(seen[1].type === 'title' && seen[1].title).toContain('✶');
  });

  it('rejects an episode that violates the user constraints even if the server sent it', async () => {
    const tooLong = structuredClone(adventure);
    tooLong.minutes = 60;
    vi.stubGlobal('fetch', vi.fn(async () => sseResponse([{ type: 'episode', adventure: tooLong, model: 'x', repaired: false }])));
    await expect(requestEpisode({ prefs })).rejects.toMatchObject({ code: 'invalid_output' });
  });

  it('surfaces server error events as DirectorError', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => sseResponse([{ type: 'error', code: 'refused', message: 'The AI Director passed on this one.', retryable: false }])));
    const err = await requestEpisode({ prefs }).catch((e) => e);
    expect(err).toBeInstanceOf(DirectorError);
    expect(err.code).toBe('refused');
    expect(err.inStream).toBe(true);
  });

  it('tells a provider limit hit while writing apart from the server turning the visitor away', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => sseResponse([{ type: 'error', code: 'rate_limited', message: 'The AI Director is busy right now.', retryable: true }])));
    const inStream = await requestEpisode({ prefs }).catch((e) => e);
    expect(inStream).toMatchObject({ code: 'rate_limited', inStream: true, message: 'The AI Director is busy right now.' });
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: 'rate_limited', retryAfterMs: 2 * 3_600_000 }), { status: 429 })));
    const refused = await requestEpisode({ prefs }).catch((e) => e);
    expect(refused.inStream).toBeUndefined();
    expect(refused.retryAfterMs).toBe(2 * 3_600_000);
    expect(refused.message).toBe('The AI Director is taking a short break — back in about 2 hours.');
  });

  it('maps HTTP errors (rate limit) and network failures', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: 'rate_limited' }), { status: 429 })));
    await expect(requestEpisode({ prefs })).rejects.toMatchObject({ code: 'rate_limited', retryable: true });
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    }));
    await expect(requestEpisode({ prefs })).rejects.toMatchObject({ code: 'network' });
  });

  it('reports an incomplete stream', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => sseResponse([{ type: 'phase', phase: 'writing' }])));
    await expect(requestEpisode({ prefs })).rejects.toMatchObject({ code: 'incomplete' });
  });
});

describe('fetchDirectorStatus', () => {
  it('reports no_server when the API is unreachable or not ours', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    }));
    expect((await fetchDirectorStatus()).state).toBe('no_server');
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<html>static host</html>', { status: 200 })));
    expect((await fetchDirectorStatus()).state).toBe('no_server');
  });

  it('passes through the verified server state', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ configured: true, state: 'online', model: 'claude-opus-5-5', label: 'Online', detail: '…', canGenerate: true, checkedAt: 1 })));
    const s = await fetchDirectorStatus();
    expect(s).toMatchObject({ state: 'online', canGenerate: true, configured: true });
  });
});

describe('requestEpisode on a connection that stalls', () => {
  const enc = (s: string) => new TextEncoder().encode(s);
  const abortError = () => new DOMException('The operation was aborted.', 'AbortError');

  /** A fetch that never answers (until it is aborted), like a request stuck on a sleeping radio. */
  const hangingFetch = () =>
    vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(abortError()));
        }),
    );

  /** Headers, then `: ping` every `pingMs` (none if 0), until aborted; the episode after `finishMs` if given. */
  const streamingFetch = (opts: { pingMs: number; finishMs?: number; headers?: Record<string, string> }) =>
    vi.fn(async (_url: string, init?: RequestInit) => {
      let ctl!: ReadableStreamDefaultController<Uint8Array>;
      let ping: ReturnType<typeof setInterval> | undefined;
      let finish: ReturnType<typeof setTimeout> | undefined;
      const stop = () => {
        clearInterval(ping);
        clearTimeout(finish);
      };
      const body = new ReadableStream<Uint8Array>({
        start(c) {
          ctl = c;
          c.enqueue(enc(': plot twist incoming\n\n'));
        },
      });
      init?.signal?.addEventListener('abort', () => {
        stop();
        ctl.error(abortError());
      });
      if (opts.pingMs) ping = setInterval(() => ctl.enqueue(enc(': ping\n\n')), opts.pingMs);
      if (opts.finishMs !== undefined)
        finish = setTimeout(() => {
          stop();
          ctl.enqueue(enc(`event: episode\ndata: ${JSON.stringify({ type: 'episode', adventure, model: 'x', repaired: false })}\n\n`));
          ctl.close();
        }, opts.finishMs);
      return new Response(body, { status: 200, headers: { 'content-type': 'text/event-stream', ...(opts.headers ?? {}) } });
    });

  const settle = (p: Promise<unknown>) => {
    const out: { value?: unknown; error?: unknown; done: boolean } = { done: false };
    p.then(
      (value) => Object.assign(out, { value, done: true }),
      (error) => Object.assign(out, { error, done: true }),
    );
    return out;
  };

  afterEach(() => vi.useRealTimers());

  it('gives up on a request that is never answered (STREAM_IDLE_MS), as a stalled connection', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', hangingFetch());
    const out = settle(requestEpisode({ prefs }));
    await vi.advanceTimersByTimeAsync(STREAM_IDLE_MS - 1_000);
    expect(out.done).toBe(false);
    await vi.advanceTimersByTimeAsync(2_000);
    expect(out.done).toBe(true);
    expect(out.error).toBeInstanceOf(DirectorError);
    expect(out.error).toMatchObject({ code: 'stalled', message: 'The connection to the AI Director stalled.' });
  });

  it('gives up on a stream that goes silent after its headers', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', streamingFetch({ pingMs: 0 }));
    const out = settle(requestEpisode({ prefs }));
    await vi.advanceTimersByTimeAsync(STREAM_IDLE_MS + 1_000);
    expect(out.error).toMatchObject({ code: 'stalled' });
  });

  it('keeps waiting while the server pings, and gets the episode', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', streamingFetch({ pingMs: 15_000, finishMs: 140_000, headers: { 'x-plot-twist-deadline-ms': '150000' } }));
    const out = settle(requestEpisode({ prefs }));
    await vi.advanceTimersByTimeAsync(141_000);
    expect(out.error).toBeUndefined();
    expect((out.value as { title?: string } | undefined)?.title).toBe('The Borrowed Postcard');
  });

  it("gives up past the server's own deadline (plus a margin), even while pings keep coming", async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', streamingFetch({ pingMs: 15_000, headers: { 'x-plot-twist-deadline-ms': '60000' } }));
    const out = settle(requestEpisode({ prefs }));
    await vi.advanceTimersByTimeAsync(60_000 + STREAM_DEADLINE_MARGIN_MS - 1_000);
    expect(out.done).toBe(false);
    await vi.advanceTimersByTimeAsync(2_000);
    expect(out.error).toMatchObject({ code: 'stalled' });
  });

  it('uses a default deadline when the server does not say', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', streamingFetch({ pingMs: 15_000 }));
    const out = settle(requestEpisode({ prefs }));
    await vi.advanceTimersByTimeAsync(DEFAULT_STREAM_DEADLINE_MS - 1_000);
    expect(out.done).toBe(false);
    await vi.advanceTimersByTimeAsync(2_000);
    expect(out.error).toMatchObject({ code: 'stalled' });
  });

  it("leaves the caller's own abort an AbortError (a re-deal, a reload), never a stall", async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', streamingFetch({ pingMs: 0 }));
    const ctl = new AbortController();
    const out = settle(requestEpisode({ prefs }, { signal: ctl.signal }));
    await vi.advanceTimersByTimeAsync(5_000);
    ctl.abort();
    await vi.advanceTimersByTimeAsync(STREAM_IDLE_MS + 1_000);
    expect((out.error as Error).name).toBe('AbortError');
    vi.stubGlobal('fetch', hangingFetch());
    const ctl2 = new AbortController();
    const out2 = settle(requestEpisode({ prefs }, { signal: ctl2.signal }));
    ctl2.abort();
    await vi.advanceTimersByTimeAsync(1);
    expect((out2.error as Error).name).toBe('AbortError');
  });
});
