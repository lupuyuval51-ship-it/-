/**
 * Browser client for the AI Director API. The provider key never reaches the
 * browser — this only talks to our own server.
 */
import type { Adventure, Kind, Prefs } from '../../shared/types.ts';
import { validateAdventure, fitsPrefs } from '../../shared/validate.ts';

export type DirectorState =
  | 'not_configured'
  | 'checking'
  | 'online'
  | 'degraded'
  | 'auth_failed'
  | 'forbidden'
  | 'model_unavailable'
  | 'unreachable'
  | 'rate_limited'
  /** Browser-side only: our own server could not be reached (e.g. static hosting, offline). */
  | 'no_server';

export interface DirectorStatus {
  configured: boolean;
  state: DirectorState;
  model: string;
  label: string;
  detail: string;
  canGenerate: boolean;
  checkedAt: number | null;
}

export const NO_SERVER_STATUS: DirectorStatus = {
  configured: false,
  state: 'no_server',
  model: '',
  label: 'Offline',
  detail: 'The PLOT TWIST server is not reachable, so every episode comes from the curated archive.',
  canGenerate: false,
  checkedAt: null,
};

export async function fetchDirectorStatus(signal?: AbortSignal, refresh = false): Promise<DirectorStatus> {
  try {
    const res = await fetch(`/api/status${refresh ? '?refresh=1' : ''}`, { signal, headers: { accept: 'application/json' } });
    if (!res.ok) return { ...NO_SERVER_STATUS, checkedAt: Date.now() };
    const body = (await res.json()) as Partial<DirectorStatus>;
    if (typeof body.state !== 'string') return { ...NO_SERVER_STATUS, checkedAt: Date.now() };
    return {
      configured: Boolean(body.configured),
      state: body.state as DirectorState,
      model: String(body.model ?? ''),
      label: String(body.label ?? ''),
      detail: String(body.detail ?? ''),
      canGenerate: Boolean(body.canGenerate),
      checkedAt: typeof body.checkedAt === 'number' ? body.checkedAt : Date.now(),
    };
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    return { ...NO_SERVER_STATUS, checkedAt: Date.now() };
  }
}

export interface GenerateRequest {
  prefs: Prefs;
  detail?: string;
  localHour?: number;
  avoidTitles?: string[];
  avoidKinds?: Kind[];
}

export type DirectorEvent =
  | { type: 'phase'; phase: 'plotting' | 'writing' | 'checking' | 'repairing' }
  | { type: 'progress'; chars: number; expected: number }
  | { type: 'title'; title: string }
  | { type: 'episode'; adventure: Adventure; model: string; repaired: boolean }
  | { type: 'error'; code: string; message: string; retryable: boolean };

export class DirectorError extends Error {
  code: string;
  retryable: boolean;
  /** Set for rate limits: how long the server asked us to wait. */
  retryAfterMs?: number;
  constructor(code: string, message: string, retryable: boolean, retryAfterMs?: number) {
    super(message);
    this.code = code;
    this.retryable = retryable;
    if (retryAfterMs !== undefined) this.retryAfterMs = retryAfterMs;
  }
}

/**
 * Requests one personalized episode. Streams progress via `onEvent` and resolves
 * with an adventure that passed validation *and* the user's hard constraints —
 * the browser re-checks everything the server already checked.
 */
export async function requestEpisode(req: GenerateRequest, opts: { signal?: AbortSignal; onEvent?: (e: DirectorEvent) => void } = {}): Promise<Adventure> {
  let res: Response;
  try {
    res = await fetch('/api/episodes/generate', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'text/event-stream' },
      body: JSON.stringify(req),
      signal: opts.signal,
    });
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    throw new DirectorError('network', 'The AI Director could not be reached.', true);
  }
  if (!res.ok || !res.body) {
    let code = `http_${res.status}`;
    let retryAfterMs: number | undefined;
    try {
      const body = (await res.json()) as { error?: string; retryAfterMs?: unknown };
      if (body.error) code = body.error;
      if (typeof body.retryAfterMs === 'number' && Number.isFinite(body.retryAfterMs)) retryAfterMs = Math.max(0, body.retryAfterMs);
    } catch {
      /* not JSON */
    }
    if (retryAfterMs === undefined) {
      const header = Number(res.headers.get('retry-after'));
      if (Number.isFinite(header) && header > 0) retryAfterMs = header * 1000;
    }
    const message =
      code === 'rate_limited'
        ? 'The AI Director is taking a short break — back in a few minutes.'
        : code === 'busy'
          ? 'The AI Director is busy with other episodes right now.'
          : code === 'not_configured' || code === 'unavailable'
            ? 'The AI Director is not available right now.'
            : 'The AI Director could not take this request.';
    throw new DirectorError(code, message, code === 'rate_limited' || code === 'busy', retryAfterMs);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let result: Adventure | null = null;
  let failure: DirectorError | null = null;

  const handleBlock = (block: string) => {
    let data = '';
    for (const line of block.split('\n')) {
      if (line.startsWith('data:')) data += line.slice(5).trimStart();
    }
    if (!data) return;
    let event: DirectorEvent;
    try {
      event = JSON.parse(data) as DirectorEvent;
    } catch {
      return;
    }
    opts.onEvent?.(event);
    if (event.type === 'episode') {
      const adventure = event.adventure;
      const v = validateAdventure(adventure);
      if (!v.ok || adventure.source !== 'ai' || !fitsPrefs(adventure, req.prefs)) {
        failure = new DirectorError('invalid_output', "The AI Director's episode did not pass our checks.", true);
      } else {
        result = adventure;
      }
    } else if (event.type === 'error') {
      failure = new DirectorError(event.code, event.message, event.retryable);
    }
  };

  for (;;) {
    let chunk: ReadableStreamReadResult<Uint8Array>;
    try {
      chunk = await reader.read();
    } catch (err) {
      // A dropped connection (page unloading, network switch) is not the AI failing.
      if (opts.signal?.aborted || (err as Error).name === 'AbortError') throw err;
      throw new DirectorError('interrupted', 'The connection to the AI Director dropped.', true);
    }
    const { done, value } = chunk;
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf('\n\n')) >= 0) {
      handleBlock(buffer.slice(0, idx));
      buffer = buffer.slice(idx + 2);
    }
  }
  if (buffer.trim()) handleBlock(buffer);

  if (result) return result;
  throw failure ?? new DirectorError('incomplete', 'The AI Director stopped before finishing.', true);
}
