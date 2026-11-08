import { afterEach, describe, expect, it, vi } from 'vitest';
import { DirectorError, fetchDirectorStatus, requestEpisode, type DirectorEvent } from '../src/ai/client.ts';
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
