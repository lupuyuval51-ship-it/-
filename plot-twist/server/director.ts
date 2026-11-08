/**
 * The AI Director: asks the model for one episode, then parses, converts and
 * validates it against the same content model as curated episodes. One repair
 * round is attempted for fixable problems; otherwise the caller falls back to
 * curated content.
 */
import { AI_EPISODE_SCHEMA, aiEpisodeToAdventure, checkAiEpisodeShape, type AiEpisode } from '../shared/aiEpisode.ts';
import type { Adventure } from '../shared/types.ts';
import { checkPrefsFit, validateAdventure } from '../shared/validate.ts';
import { classifyError, type Backend, type FailureKind } from './backend.ts';
import type { Effort } from './config.ts';
import { buildRepairBrief, buildUserBrief, SYSTEM_PROMPT, type BriefInput } from './prompt.ts';
import { screenAdventure } from './safety.ts';
import type { StatusTracker } from './status.ts';

export type GeneratePhase = 'plotting' | 'writing' | 'checking' | 'repairing';

export type GenerateEvent =
  | { type: 'phase'; phase: GeneratePhase }
  | { type: 'progress'; chars: number; expected: number }
  | { type: 'title'; title: string }
  | { type: 'episode'; adventure: Adventure; model: string; repaired: boolean; fixes: string[] }
  | { type: 'error'; code: FailureKind; message: string; retryable: boolean };

export interface DirectorDeps {
  backend: Backend;
  effort: Effort;
  status?: StatusTracker;
  log?: (message: string) => void;
}

/** Roughly how many characters a finished episode JSON has — used for an honest progress estimate. */
export const EXPECTED_EPISODE_CHARS = 6_500;

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
    ...screenAdventure(adventure),
  ];
  if (problems.length) return { ok: false, kind: 'invalid_output', problems, draft: text };
  return { ok: true, adventure, fixes, model: '' };
}

export async function generateEpisode(
  input: BriefInput,
  deps: DirectorDeps,
  signal: AbortSignal,
  emit: (event: GenerateEvent) => void,
): Promise<Adventure | null> {
  const { backend, effort, status } = deps;
  const log = deps.log ?? ((m: string) => console.log(`[plot-twist] ${m}`));
  const started = Date.now();
  let titleSent = false;

  const attempt = async (user: string): Promise<AttemptResult> => {
    let writing = false;
    let lastProgress = 0;
    emit({ type: 'phase', phase: 'plotting' });
    const result = await backend.stream(
      { system: SYSTEM_PROMPT, user, schema: AI_EPISODE_SCHEMA as unknown as Record<string, unknown>, effort },
      {
        onText: (_delta, snapshot) => {
          if (!writing) {
            writing = true;
            emit({ type: 'phase', phase: 'writing' });
          }
          if (snapshot.length - lastProgress >= 240) {
            lastProgress = snapshot.length;
            emit({ type: 'progress', chars: snapshot.length, expected: EXPECTED_EPISODE_CHARS });
          }
          if (!titleSent) {
            const title = extractStreamingTitle(snapshot);
            if (title) {
              titleSent = true;
              emit({ type: 'title', title });
            }
          }
        },
      },
      signal,
    );
    if (result.stopReason === 'refusal') return { ok: false, kind: 'refused', problems: [], draft: '' };
    if (result.stopReason === 'max_tokens') return { ok: false, kind: 'truncated', problems: [], draft: '' };
    emit({ type: 'phase', phase: 'checking' });
    const evaluated = evaluateDraft(result.text, input);
    return evaluated.ok ? { ...evaluated, model: result.model } : evaluated;
  };

  try {
    const brief = buildUserBrief(input);
    let result = await attempt(brief);
    let repaired = false;
    if (!result.ok && result.kind === 'invalid_output' && result.draft && !signal.aborted) {
      log(`draft rejected (${result.problems.length} problems): ${result.problems.slice(0, 4).join(' | ')}`);
      repaired = true;
      emit({ type: 'phase', phase: 'repairing' });
      result = await attempt(buildRepairBrief(brief, result.draft, result.problems));
    }
    const seconds = ((Date.now() - started) / 1000).toFixed(1);
    if (result.ok) {
      status?.recordSuccess();
      log(`episode "${result.adventure.title}" by ${result.model || backend.model} in ${seconds}s${repaired ? ' (repaired)' : ''}${result.fixes.length ? ` · fixes: ${result.fixes.join('; ')}` : ''}`);
      emit({ type: 'episode', adventure: result.adventure, model: result.model || backend.model, repaired, fixes: result.fixes });
      return result.adventure;
    }
    status?.recordFailure(result.kind);
    log(`generation failed after ${seconds}s: ${result.kind}${result.problems.length ? ` — ${result.problems.slice(0, 4).join(' | ')}` : ''}`);
    emit({ type: 'error', code: result.kind, message: FRIENDLY[result.kind], retryable: result.kind !== 'refused' });
    return null;
  } catch (err) {
    const c = classifyError(err);
    status?.recordFailure(c.kind);
    if (c.kind !== 'aborted') log(`generation error: ${c.kind} — ${c.message}`);
    emit({ type: 'error', code: c.kind, message: FRIENDLY[c.kind], retryable: c.retryable });
    return null;
  }
}
