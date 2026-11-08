/**
 * Tracks the AI Director's real connection status. "Configured" (a key exists) is
 * not the same as "online" (the key works for this model) — the status is only
 * reported online after a successful verification or generation.
 */
import { classifyError, type Backend, type FailureKind } from './backend.ts';

export type DirectorState =
  | 'not_configured'
  | 'checking'
  | 'online'
  | 'degraded'
  | 'auth_failed'
  | 'forbidden'
  | 'model_unavailable'
  | 'unreachable'
  | 'rate_limited';

export interface DirectorStatus {
  provider: 'anthropic';
  configured: boolean;
  state: DirectorState;
  model: string;
  /** Short label for the UI pill. */
  label: string;
  /** One sentence explaining the state and what happens next. */
  detail: string;
  /** Whether the browser should ask for AI episodes right now. */
  canGenerate: boolean;
  checkedAt: number | null;
  lastSuccessAt: number | null;
  lastFailureAt: number | null;
}

const OK_TTL_MS = 5 * 60_000;
const ERROR_TTL_MS = 30_000;

const COPY: Record<DirectorState, { label: string; detail: string }> = {
  not_configured: {
    label: 'Not configured',
    detail: 'No AI provider key is set on the server, so every episode comes from the curated archive.',
  },
  checking: { label: 'Checking…', detail: 'Checking the connection to the AI Director.' },
  online: { label: 'Online', detail: 'The AI Director is connected and writes one personalized episode per draw.' },
  degraded: {
    label: 'Unstable',
    detail: 'The AI Director is connected but a recent episode failed. Curated episodes fill in when it misses.',
  },
  auth_failed: { label: 'Key rejected', detail: 'The provider rejected the server’s API key. Curated episodes only until it is fixed.' },
  forbidden: { label: 'No access', detail: 'The server’s API key cannot use the configured model. Curated episodes only.' },
  model_unavailable: { label: 'Model unavailable', detail: 'The configured model was not found. Curated episodes only.' },
  unreachable: { label: 'Unreachable', detail: 'The AI provider cannot be reached right now. Curated episodes only; we will retry.' },
  rate_limited: { label: 'Busy', detail: 'The AI provider is rate-limiting requests. Curated episodes only for a moment.' },
};

function stateForFailure(kind: FailureKind): DirectorState {
  switch (kind) {
    case 'auth':
      return 'auth_failed';
    case 'forbidden':
      return 'forbidden';
    case 'model_unavailable':
      return 'model_unavailable';
    case 'rate_limited':
    case 'overloaded':
      return 'rate_limited';
    case 'network':
    case 'timeout':
      return 'unreachable';
    default:
      return 'degraded';
  }
}

export class StatusTracker {
  #backend: Backend | null;
  #model: string;
  #now: () => number;
  #state: DirectorState;
  #checkedAt: number | null = null;
  #lastSuccessAt: number | null = null;
  #lastFailureAt: number | null = null;
  #inflight: Promise<void> | null = null;

  constructor(backend: Backend | null, model: string, now: () => number = Date.now) {
    this.#backend = backend;
    this.#model = model;
    this.#now = now;
    this.#state = backend ? 'checking' : 'not_configured';
  }

  get configured(): boolean {
    return this.#backend !== null;
  }

  /** Verifies the connection if the cached result is stale. Never throws. */
  async refresh(force = false): Promise<DirectorStatus> {
    if (!this.#backend) return this.snapshot();
    const age = this.#checkedAt === null ? Infinity : this.#now() - this.#checkedAt;
    const ttl = this.#state === 'online' || this.#state === 'degraded' ? OK_TTL_MS : ERROR_TTL_MS;
    if (force || age > ttl) {
      this.#inflight ??= this.#verify().finally(() => {
        this.#inflight = null;
      });
      await this.#inflight;
    }
    return this.snapshot();
  }

  async #verify(): Promise<void> {
    const backend = this.#backend;
    if (!backend) return;
    try {
      await backend.verify(AbortSignal.timeout(9_000));
      // A recent generation failure keeps the state "degraded" until a generation succeeds.
      this.#state = this.#state === 'degraded' && this.#lastFailureAt !== null && this.#now() - this.#lastFailureAt < OK_TTL_MS ? 'degraded' : 'online';
    } catch (err) {
      const c = classifyError(err);
      this.#state = stateForFailure(c.kind === 'aborted' ? 'timeout' : c.kind);
      console.warn(`[plot-twist] AI Director check failed: ${c.kind} — ${c.message}`);
    }
    this.#checkedAt = this.#now();
  }

  recordSuccess(): void {
    if (!this.#backend) return;
    this.#state = 'online';
    this.#lastSuccessAt = this.#now();
    this.#checkedAt = this.#now();
  }

  recordFailure(kind: FailureKind): void {
    if (!this.#backend) return;
    if (kind === 'aborted') return; // the user navigated away; not a provider problem
    this.#state = stateForFailure(kind);
    this.#lastFailureAt = this.#now();
    this.#checkedAt = this.#now();
  }

  snapshot(): DirectorStatus {
    const copy = COPY[this.#state];
    return {
      provider: 'anthropic',
      configured: this.configured,
      state: this.#state,
      model: this.#model,
      label: copy.label,
      detail: copy.detail,
      canGenerate: this.#state === 'online' || this.#state === 'degraded',
      checkedAt: this.#checkedAt,
      lastSuccessAt: this.#lastSuccessAt,
      lastFailureAt: this.#lastFailureAt,
    };
  }
}
