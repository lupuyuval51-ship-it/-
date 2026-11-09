/**
 * Tracks the AI Director's real connection status. "Configured" (a key exists) is
 * not the same as "online" (the key works for this model) — the status is only
 * reported online after a successful verification or generation.
 *
 * The status is shared by every visitor, so only provider-level outcomes change
 * it. One request's refusal or rejected draft is logged by the Director, not
 * shown to everyone. A provider failure while writing (busy, unreachable, a
 * stalled stream) is held for ERROR_TTL_MS even if the free Models API check
 * still answers, because that check says nothing about the Messages API.
 */
import { classifyError, type Backend, type FailureKind } from './backend.ts';

export type DirectorState =
  | 'not_configured'
  | 'misconfigured'
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
/** How long an error state is cached, and how long a provider failure while writing is held. */
export const ERROR_TTL_MS = 30_000;
/** A forced refresh (`?refresh=1`) re-checks the provider at most this often; it costs a call with the server's key. */
export const FORCED_REFRESH_MIN_AGE_MS = 15_000;

const COPY: Record<DirectorState, { label: string; detail: string }> = {
  not_configured: {
    label: 'Not configured',
    detail: 'No AI provider key is set on the server, so every episode comes from the curated archive.',
  },
  misconfigured: {
    label: 'Key invalid',
    detail: 'The server’s API key is malformed (it contains characters a key cannot have), so it was never sent. Curated episodes only until it is fixed.',
  },
  checking: { label: 'Checking…', detail: 'Checking the connection to the AI Director.' },
  online: { label: 'Online', detail: 'The AI Director is connected and writes one personalized episode per draw.' },
  degraded: {
    label: 'Unstable',
    detail: 'The AI Director is connected, but writing failed a moment ago. Curated episodes fill in when it misses.',
  },
  auth_failed: { label: 'Key rejected', detail: 'The provider rejected the server’s API key. Curated episodes only until it is fixed.' },
  forbidden: { label: 'No access', detail: 'The server’s API key cannot use the configured model. Curated episodes only.' },
  model_unavailable: { label: 'Model unavailable', detail: 'The configured model was not found. Curated episodes only.' },
  unreachable: { label: 'Unreachable', detail: 'The AI provider cannot be reached right now. Curated episodes only; we will retry.' },
  rate_limited: { label: 'Busy', detail: 'The AI provider is busy right now. Curated episodes only for a moment.' },
};

/** More specific explanations for some causes (the label stays the state's). */
const DETAIL = {
  /** The Models API answered with a 5xx or something unexpected: nothing was generated, so no episode "failed". */
  checkTrouble: 'The AI provider is not answering properly right now. Curated episodes only; we will check again shortly.',
  /** A generation stalled until our deadline. */
  stalled: 'The AI provider stopped responding while writing an episode. Curated episodes only for a moment; we will retry.',
};

/**
 * Failures that say something about the provider (shared by everyone), as opposed to one request.
 * The Director records 'timeout' only for a provider that went quiet (no headers, event or ping
 * for its idle limit) or never answered: a long but active generation that runs out of time is
 * about that one request and is only logged.
 */
const PROVIDER_FAILURES: ReadonlySet<FailureKind> = new Set([
  'auth',
  'forbidden',
  'model_unavailable',
  'rate_limited',
  'overloaded',
  'network',
  'timeout',
  'server',
  'unknown',
]);

interface Held {
  state: DirectorState;
  detail: string | null;
}

export interface StatusOptions {
  /** A key was set but is unusable (see ServerConfig.apiKeyProblem): report "misconfigured". */
  misconfigured?: boolean;
  log?: (message: string) => void;
}

export class StatusTracker {
  #backend: Backend | null;
  #model: string;
  #now: () => number;
  #misconfigured: boolean;
  #log: (message: string) => void;
  #state: DirectorState;
  #detail: string | null = null;
  #checkedAt: number | null = null;
  /** When the cached state should be verified again. */
  #expiresAt = 0;
  #lastSuccessAt: number | null = null;
  #lastFailureAt: number | null = null;
  /** The last provider-level failure while writing, held for ERROR_TTL_MS. */
  #lastFailure: { kind: FailureKind; at: number } | null = null;
  #inflight: Promise<void> | null = null;

  constructor(backend: Backend | null, model: string, now: () => number = Date.now, opts: StatusOptions = {}) {
    this.#backend = backend;
    this.#model = model;
    this.#now = now;
    this.#misconfigured = !backend && Boolean(opts.misconfigured);
    this.#log = opts.log ?? ((m: string) => console.warn(`[plot-twist] ${m}`));
    this.#state = backend ? 'checking' : this.#misconfigured ? 'misconfigured' : 'not_configured';
  }

  /** A key is set on the server (even if it turned out to be unusable). */
  get configured(): boolean {
    return this.#backend !== null || this.#misconfigured;
  }

  /**
   * Verifies the connection if the cached result is stale. `force` (the user asked,
   * or a generation just failed) re-checks sooner, but never more than once per
   * FORCED_REFRESH_MIN_AGE_MS — otherwise anyone could make the server call the
   * provider in a loop. Never throws.
   */
  async refresh(force = false): Promise<DirectorStatus> {
    if (!this.#backend) return this.snapshot();
    const now = this.#now();
    const age = this.#checkedAt === null ? Infinity : now - this.#checkedAt;
    const stale = this.#checkedAt === null || now >= this.#expiresAt;
    if (stale || (force && age >= FORCED_REFRESH_MIN_AGE_MS)) {
      this.#inflight ??= this.#verify().finally(() => {
        this.#inflight = null;
      });
      await this.#inflight;
    }
    return this.snapshot();
  }

  /** A provider failure while writing that is still within its hold window. */
  #held(now: number): Held | null {
    const f = this.#lastFailure;
    if (!f || now - f.at >= ERROR_TTL_MS) return null;
    switch (f.kind) {
      case 'rate_limited':
      case 'overloaded':
        return { state: 'rate_limited', detail: null };
      case 'network':
        return { state: 'unreachable', detail: null };
      case 'timeout':
        return { state: 'unreachable', detail: DETAIL.stalled };
      default: // server, unknown
        return { state: 'degraded', detail: null };
    }
  }

  #set(state: DirectorState, detail: string | null, expiresAt: number) {
    this.#state = state;
    this.#detail = detail;
    this.#expiresAt = expiresAt;
  }

  async #verify(): Promise<void> {
    const backend = this.#backend;
    if (!backend) return;
    let outcome: FailureKind | 'ok' = 'ok';
    try {
      await backend.verify(AbortSignal.timeout(9_000));
    } catch (err) {
      const c = classifyError(err);
      outcome = c.kind === 'aborted' ? 'timeout' : c.kind; // our own 9 s guard surfaces as an abort
      this.#log(`AI Director check failed: ${outcome} — ${c.message}`);
    }
    const now = this.#now();
    this.#checkedAt = now;

    if (outcome === 'ok' || outcome === 'rate_limited' || outcome === 'overloaded') {
      // The key and model work. A 429/529 from the free Models API is about that endpoint,
      // not about writing episodes, so it is transient: never switch generation off for it.
      const transient = outcome !== 'ok';
      const held = this.#held(now);
      if (held) {
        // Still within the hold window of a failure while writing: keep showing it.
        this.#set(held.state, held.detail, this.#lastFailure!.at + ERROR_TTL_MS);
      } else if (transient && (this.#state === 'online' || this.#state === 'degraded')) {
        this.#expiresAt = now + ERROR_TTL_MS; // keep the state, look again soon
      } else {
        this.#set('online', null, now + (transient ? ERROR_TTL_MS : OK_TTL_MS));
      }
      return;
    }
    switch (outcome) {
      case 'auth':
        return this.#set('auth_failed', null, now + ERROR_TTL_MS);
      case 'forbidden':
        return this.#set('forbidden', null, now + ERROR_TTL_MS);
      case 'model_unavailable':
        return this.#set('model_unavailable', null, now + ERROR_TTL_MS);
      case 'network':
      case 'timeout':
        return this.#set('unreachable', null, now + ERROR_TTL_MS);
      default:
        // 5xx, unknown errors: nothing was generated, so say nothing about episodes.
        return this.#set('unreachable', DETAIL.checkTrouble, now + ERROR_TTL_MS);
    }
  }

  recordSuccess(): void {
    if (!this.#backend) return;
    const now = this.#now();
    this.#lastFailure = null;
    this.#lastSuccessAt = now;
    this.#checkedAt = now;
    this.#set('online', null, now + OK_TTL_MS);
  }

  /**
   * Records how a generation ended. Outcomes about one request (the user left,
   * a refusal, a rejected or truncated draft, a bad request) change nothing
   * here — the Director logs them — so one visitor cannot make the AI Director
   * look broken for everyone.
   */
  recordFailure(kind: FailureKind): void {
    if (!this.#backend || !PROVIDER_FAILURES.has(kind)) return;
    const now = this.#now();
    this.#lastFailureAt = now;
    this.#checkedAt = now;
    if (kind === 'auth') return this.#set('auth_failed', null, now + ERROR_TTL_MS);
    if (kind === 'forbidden') return this.#set('forbidden', null, now + ERROR_TTL_MS);
    if (kind === 'model_unavailable') return this.#set('model_unavailable', null, now + ERROR_TTL_MS);
    this.#lastFailure = { kind, at: now };
    const held = this.#held(now)!;
    this.#set(held.state, held.detail, now + ERROR_TTL_MS);
  }

  snapshot(): DirectorStatus {
    const copy = COPY[this.#state];
    return {
      provider: 'anthropic',
      configured: this.configured,
      state: this.#state,
      model: this.#model,
      label: copy.label,
      detail: this.#detail ?? copy.detail,
      canGenerate: this.#state === 'online' || this.#state === 'degraded',
      checkedAt: this.#checkedAt,
      lastSuccessAt: this.#lastSuccessAt,
      lastFailureAt: this.#lastFailureAt,
    };
  }
}
