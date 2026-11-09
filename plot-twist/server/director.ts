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
  /** Clock for the budget arithmetic (tests). The deadline timers themselves always use real time. */
  now?: () => number;
}

/** Roughly how many characters a finished episode JSON has — used for an honest progress estimate. */
export const EXPECTED_EPISODE_CHARS = 6_500;
export const DEFAULT_ATTEMPT_TIMEOUT_MS = 120_000;
export const DEFAULT_DEADLINE_MS = 150_000;

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
  const now = deps.now ?? Date.now;
  const started = now();
  const elapsed = () => ((now() - started) / 1000).toFixed(1);
  const remaining = () => deadlineMs - (now() - started);

  // `signal` aborts when the user leaves (or with a deadline reason from the caller's backstop).
  // The overall deadline bounds everything, each attempt also has its own timer.
  const deadline = AbortSignal.timeout(deadlineMs);
  const overall = AbortSignal.any([signal, deadline]);
  const timers: { attempt: AbortSignal | null } = { attempt: null };

  const attempt = async (user: string, n: 1 | 2): Promise<AttemptResult> => {
    let writing = false;
    let lastProgress = 0;
    let titleSent = false;
    timers.attempt = AbortSignal.timeout(Math.max(1, Math.min(attemptTimeoutMs, remaining())));
    const attemptSignal = AbortSignal.any([overall, timers.attempt]);
    if (n === 1) emit({ type: 'phase', phase: 'plotting', attempt: n });
    const result = await untilAborted(
      backend.stream(
        { system: SYSTEM_PROMPT, user, schema: AI_EPISODE_SCHEMA as unknown as Record<string, unknown>, effort },
        {
          onText: (_delta, snapshot) => {
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
    let result = await attempt(brief, 1);
    let repaired = false;
    if (!result.ok && result.kind === 'invalid_output' && result.draft && !overall.aborted) {
      log(`draft rejected (${result.problems.length} problems): ${result.problems.slice(0, 4).join(' | ')}`);
      const left = remaining();
      if (left >= Math.min(20_000, deadlineMs / 5)) {
        repaired = true;
        emit({ type: 'phase', phase: 'repairing', attempt: 2 });
        result = await attempt(buildRepairBrief(brief, result.draft, result.problems), 2);
      } else {
        log(`skipping the repair round: only ${(left / 1000).toFixed(1)}s of the budget left`);
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
    // the user leaving is "aborted"; a server-side deadline (overall, per attempt, or the
    // caller's backstop) is a "timeout" — a stalled provider, never "Cancelled.".
    let kind: FailureKind = c.kind;
    let detail = c.message;
    if (signal.aborted) {
      kind = isDeadline(signal.reason) ? 'timeout' : 'aborted';
      if (kind === 'timeout') detail = 'the server deadline for this request passed';
    } else if (deadline.aborted) {
      kind = 'timeout';
      detail = `no complete episode within the ${Math.round(deadlineMs / 1000)}s budget`;
    } else if (timers.attempt?.aborted) {
      kind = 'timeout';
      detail = `one attempt took longer than ${Math.round(attemptTimeoutMs / 1000)}s`;
    }
    status?.recordFailure(kind);
    if (kind !== 'aborted') log(`generation error after ${elapsed()}s: ${kind} — ${detail}`);
    emit({ type: 'error', code: kind, message: FRIENDLY[kind], retryable: kind === 'timeout' || kind === 'aborted' ? true : c.retryable });
    return null;
  }
}
