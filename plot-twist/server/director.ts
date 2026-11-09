/**
 * The AI Director: asks the model for one episode, then parses, converts and
 * validates it against the same content model as curated episodes. One repair
 * round is attempted for fixable problems; otherwise the caller falls back to
 * curated content.
 *
 * Event sequence of a generation (each event may carry `attempt`: 1, or 2 for the repair):
 *   phase:plotting → phase:writing → progress… / title → phase:checking → episode
 * and when the first draft is rejected:
 *   … phase:checking → phase:repairing → progress… / title → phase:checking → episode | error
 * The repair attempt never re-emits plotting/writing, so its label stays on "repairing"
 * while it streams, and its title is sent again (it may differ from the rejected draft's).
 */
import { AI_EPISODE_SCHEMA, aiEpisodeToAdventure, checkAiEpisodeShape, type AiEpisode } from '../shared/aiEpisode.ts';
import type { Adventure } from '../shared/types.ts';
import { checkPrefsFit, validateAdventure } from '../shared/validate.ts';
import { classifyError, type Backend, type FailureKind } from './backend.ts';
import type { Effort } from './config.ts';
import { checkHardConstraints } from './constraints.ts';
import { buildRepairBrief, buildUserBrief, SYSTEM_PROMPT, type BriefInput } from './prompt.ts';
import { screenAdventure } from './safety.ts';
import type { StatusTracker } from './status.ts';

export type GeneratePhase = 'plotting' | 'writing' | 'checking' | 'repairing';

export type GenerateEvent =
  | { type: 'phase'; phase: GeneratePhase; attempt?: number }
  | { type: 'progress'; chars: number; expected: number; attempt?: number }
  | { type: 'title'; title: string; attempt?: number }
  | { type: 'episode'; adventure: Adventure; model: string; repaired: boolean; fixes: string[] }
  | { type: 'error'; code: FailureKind; message: string; retryable: boolean };

export interface DirectorDeps {
  backend: Backend;
  effort: Effort;
  status?: StatusTracker;
  log?: (message: string) => void;
  /** Upper bound for one model attempt, response stream included (ms). Default 120 s. */
  attemptTimeoutMs?: number;
  /** Overall budget for the whole generation, repair round included (ms). Default 150 s. */
  deadlineMs?: number;
  /**
   * How long the provider may send nothing at all (no response headers, no streamed
   * event, no ping) before an attempt that runs out of time counts as a stalled
   * provider — the shared status then shows Unreachable. A slow but active stream that
   * runs out of time fails only its own request. Default: 30 s, or half the attempt
   * timeout when that is shorter.
   */
  idleTimeoutMs?: number;
  /** Clock for the budget arithmetic (tests). The deadline timers themselves always use real time. */
  now?: () => number;
}

/** Roughly how many characters a finished episode JSON has — used for an honest progress estimate. */
export const EXPECTED_EPISODE_CHARS = 6_500;
export const DEFAULT_ATTEMPT_TIMEOUT_MS = 120_000;
export const DEFAULT_DEADLINE_MS = 150_000;
export const DEFAULT_IDLE_TIMEOUT_MS = 30_000;
/** A repair round needs at least this much of the budget (or a fifth of it, if smaller), and at least as long as the first draft took. */
export const MIN_REPAIR_MS = 20_000;

const FRIENDLY: Record<FailureKind, string> = {
  aborted: 'Cancelled.',
  timeout: 'The AI Director took too long to write this one.',
  network: 'The AI Director could not be reached.',
  auth: 'The AI Director is not available on this server.',
  forbidden: 'The AI Director is not available on this server.',
  model_unavailable: 'The AI Director is not available on this server.',
  rate_limited: 'The AI Director is busy right now.',
  overloaded: 'The AI Director is busy right now.',
  server: 'The AI Director hit a problem while writing.',
  bad_request: 'The AI Director could not take this request.',
  refused: 'The AI Director passed on this one.',
  truncated: 'The AI Director ran out of pages.',
  invalid_output: "The AI Director's draft did not pass our quality checks.",
  unknown: 'Something went wrong while writing.',
};

/** Abort reason for a server-side deadline (distinguishes it from the user leaving). */
export function deadlineReason(message = 'The generation deadline passed'): DOMException {
  return new DOMException(message, 'TimeoutError');
}

const isDeadline = (reason: unknown) => reason instanceof Error && reason.name === 'TimeoutError';

const TITLE_PATTERN = /^\s*\{\s*"title"\s*:\s*"((?:[^"\\]|\\.)*)"/;

/** Pulls the title out of a partial JSON stream as soon as it is complete. */
export function extractStreamingTitle(snapshot: string): string | null {
  const m = TITLE_PATTERN.exec(snapshot);
  if (!m) return null;
  try {
    const title = JSON.parse(`"${m[1]}"`) as string;
    return title.trim() ? title.trim().slice(0, 60) : null;
  } catch {
    return null;
  }
}

type AttemptResult =
  | { ok: true; adventure: Adventure; fixes: string[]; model: string }
  | { ok: false; kind: FailureKind; problems: string[]; draft: string };

/** Parses + converts + validates raw model text. Exported for tests. */
export function evaluateDraft(text: string, input: BriefInput): AttemptResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, kind: 'invalid_output', problems: ['The output was not valid JSON.'], draft: text };
  }
  const shape = checkAiEpisodeShape(parsed);
  if (shape.length) return { ok: false, kind: 'invalid_output', problems: shape, draft: text };

  const { adventure, fixes } = aiEpisodeToAdventure(parsed as AiEpisode, input.prefs);
  const validation = validateAdventure(adventure);
  const problems = [
    ...validation.errors,
    ...checkPrefsFit(adventure, input.prefs).map((issue) => `The episode ${issue}.`),
    // Only once the structure is valid: the text checks assume a well-formed episode.
    ...(validation.ok ? checkHardConstraints(adventure, input).map((p) => `Hard constraint: ${p.message}`) : []),
    ...screenAdventure(adventure),
  ];
  if (problems.length) return { ok: false, kind: 'invalid_output', problems, draft: text };
  return { ok: true, adventure, fixes, model: '' };
}

/** Resolves like `work`, but rejects with the signal's reason as soon as it aborts (even if `work` ignores it). */
function untilAborted<T>(work: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) return Promise.reject(signal.reason);
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(signal.reason);
    signal.addEventListener('abort', onAbort, { once: true });
    work.then(
      (value) => {
        signal.removeEventListener('abort', onAbort);
        resolve(value);
      },
      (err: unknown) => {
        signal.removeEventListener('abort', onAbort);
        reject(err);
      },
    );
  });
}

/** One model attempt in flight: its own timer, and when the provider last showed a sign of life. */
interface AttemptState {
  n: 1 | 2;
  startedAt: number;
  /** Response headers, a streamed event or a ping (or the attempt's start, before any of them). */
  lastSignAt: number;
  headers: boolean;
  timer: AbortSignal;
  /** What the timer stands for: the attempt cap, or what was left of the overall budget. */
  limit: 'attempt' | 'deadline';
}

const secs = (ms: number) => (ms / 1000).toFixed(1);
/** "150" for whole seconds, "0.2" otherwise (log details). */
const wholeSecs = (ms: number) => (ms % 1000 === 0 ? String(ms / 1000) : secs(ms));

export async function generateEpisode(
  input: BriefInput,
  deps: DirectorDeps,
  signal: AbortSignal,
  emit: (event: GenerateEvent) => void,
): Promise<Adventure | null> {
  const { backend, effort, status } = deps;
  const log = deps.log ?? ((m: string) => console.log(`[plot-twist] ${m}`));
  const attemptTimeoutMs = deps.attemptTimeoutMs ?? DEFAULT_ATTEMPT_TIMEOUT_MS;
  const deadlineMs = deps.deadlineMs ?? DEFAULT_DEADLINE_MS;
  const idleTimeoutMs = deps.idleTimeoutMs ?? Math.min(DEFAULT_IDLE_TIMEOUT_MS, attemptTimeoutMs / 2);
  const now = deps.now ?? Date.now;
  const started = now();
  const elapsed = () => secs(now() - started);
  const remaining = () => deadlineMs - (now() - started);

  // `signal` aborts when the user leaves (or with a deadline reason from the caller's backstop).
  // The overall deadline bounds everything, each attempt also has its own timer.
  const deadline = AbortSignal.timeout(deadlineMs);
  const overall = AbortSignal.any([signal, deadline]);
  // An object, not a `let`: it is assigned inside `attempt`, where control-flow narrowing cannot see it.
  const inFlight: { attempt: AttemptState | null } = { attempt: null };

  const attempt = async (user: string, n: 1 | 2): Promise<AttemptResult> => {
    let writing = false;
    let lastProgress = 0;
    let titleSent = false;
    const budget = remaining();
    const startedAt = now();
    const state: AttemptState = {
      n,
      startedAt,
      lastSignAt: startedAt,
      headers: false,
      timer: AbortSignal.timeout(Math.max(1, Math.min(attemptTimeoutMs, budget))),
      limit: budget <= attemptTimeoutMs ? 'deadline' : 'attempt',
    };
    inFlight.attempt = state;
    const alive = () => {
      state.lastSignAt = now();
    };
    const attemptSignal = AbortSignal.any([overall, state.timer]);
    if (n === 1) emit({ type: 'phase', phase: 'plotting', attempt: n });
    const result = await untilAborted(
      backend.stream(
        { system: SYSTEM_PROMPT, user, schema: AI_EPISODE_SCHEMA as unknown as Record<string, unknown>, effort },
        {
          onActivity: (what) => {
            alive();
            if (what === 'headers') state.headers = true;
          },
          onThinking: alive,
          onText: (_delta, snapshot) => {
            alive();
            if (attemptSignal.aborted) return;
            if (n === 1 && !writing) {
              writing = true;
              emit({ type: 'phase', phase: 'writing', attempt: n });
            }
            if (snapshot.length - lastProgress >= 240) {
              lastProgress = snapshot.length;
              emit({ type: 'progress', chars: snapshot.length, expected: EXPECTED_EPISODE_CHARS, attempt: n });
            }
            if (!titleSent) {
              const title = extractStreamingTitle(snapshot);
              if (title) {
                titleSent = true;
                emit({ type: 'title', title, attempt: n });
              }
            }
          },
        },
        attemptSignal,
      ),
      attemptSignal,
    );
    if (result.stopReason === 'refusal') return { ok: false, kind: 'refused', problems: [], draft: '' };
    if (result.stopReason === 'max_tokens') return { ok: false, kind: 'truncated', problems: [], draft: '' };
    emit({ type: 'phase', phase: 'checking', attempt: n });
    const evaluated = evaluateDraft(result.text, input);
    return evaluated.ok ? { ...evaluated, model: result.model } : evaluated;
  };

  try {
    const brief = buildUserBrief(input);
    const firstStarted = now();
    let result = await attempt(brief, 1);
    const firstMs = now() - firstStarted;
    let repaired = false;
    if (!result.ok && result.kind === 'invalid_output' && result.draft && !overall.aborted) {
      log(`draft rejected (${result.problems.length} problems): ${result.problems.slice(0, 4).join(' | ')}`);
      // A repair rewrites the whole episode, so it takes about as long as the first draft did:
      // starting one that the deadline will cut only makes the user wait longer for the fallback.
      const left = remaining();
      if (left >= Math.max(firstMs, Math.min(MIN_REPAIR_MS, deadlineMs / 5))) {
        repaired = true;
        emit({ type: 'phase', phase: 'repairing', attempt: 2 });
        result = await attempt(buildRepairBrief(brief, result.draft, result.problems), 2);
      } else {
        log(`skipping the repair round: only ${secs(left)}s of the budget left, and the first draft took ${secs(firstMs)}s`);
      }
    }
    if (result.ok) {
      status?.recordSuccess();
      log(`episode "${result.adventure.title}" by ${result.model || backend.model} in ${elapsed()}s${repaired ? ' (repaired)' : ''}${result.fixes.length ? ` · fixes: ${result.fixes.join('; ')}` : ''}`);
      emit({ type: 'episode', adventure: result.adventure, model: result.model || backend.model, repaired, fixes: result.fixes });
      return result.adventure;
    }
    // The status tracker ignores outcomes that are about this one request (refused, invalid_output…).
    status?.recordFailure(result.kind);
    log(`generation failed after ${elapsed()}s: ${result.kind}${result.problems.length ? ` — ${result.problems.slice(0, 4).join(' | ')}` : ''}`);
    emit({ type: 'error', code: result.kind, message: FRIENDLY[result.kind], retryable: result.kind !== 'refused' });
    return null;
  } catch (err) {
    const c = classifyError(err);
    // The SDK reports every abort as a user abort, so the cause is read from our own signals:
    // the user leaving is "aborted"; running out of time (the overall budget, the attempt cap,
    // or the caller's backstop) is a "timeout", never "Cancelled.". The budget is checked
    // before the attempt timer: the timer of a repair round is sized to what was left of it.
    let kind: FailureKind = c.kind;
    let detail = c.message;
    // Whether the failure says something about the provider (then everyone's status changes)
    // or only about this request. A timeout is the provider's only if it had gone quiet.
    let aboutProvider = true;
    const attemptNow = inFlight.attempt;
    const silentMs = attemptNow ? now() - attemptNow.lastSignAt : 0;
    const timedOut = (what: string) => {
      kind = 'timeout';
      aboutProvider = silentMs >= idleTimeoutMs;
      const sending = attemptNow?.headers ? 'still streaming' : 'still connecting';
      detail = `${what}; ${aboutProvider ? `the provider had sent nothing for ${secs(silentMs)}s (stalled)` : `the provider was ${sending} (last sign ${secs(silentMs)}s before), so only this request failed`}`;
    };
    // An error from the provider itself (a 529, a 401…) keeps its kind even if it arrived as the budget ran out.
    const cutShort = c.kind === 'aborted' || c.kind === 'timeout';
    if (signal.aborted && !isDeadline(signal.reason)) {
      kind = 'aborted';
    } else if (signal.aborted || deadline.aborted || (cutShort && remaining() <= 0) || (attemptNow?.timer.aborted && attemptNow.limit === 'deadline')) {
      timedOut(`no complete episode within the ${wholeSecs(deadlineMs)}s budget${attemptNow?.n === 2 ? ' (the repair round was cut)' : ''}`);
    } else if (attemptNow?.timer.aborted) {
      timedOut(`one attempt took longer than ${wholeSecs(attemptTimeoutMs)}s`);
    } else if (c.kind === 'timeout') {
      detail = 'no response headers within the attempt timeout'; // the SDK's own timer: the provider never answered
    }
    if (aboutProvider) status?.recordFailure(kind);
    if (kind !== 'aborted') log(`generation error after ${elapsed()}s: ${kind} — ${detail}${aboutProvider ? '' : ' (shared status unchanged)'}`);
    emit({ type: 'error', code: kind, message: FRIENDLY[kind], retryable: kind === 'timeout' || kind === 'aborted' ? true : c.retryable });
    return null;
  }
}
