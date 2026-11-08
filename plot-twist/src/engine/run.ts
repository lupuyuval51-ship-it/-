/**
 * An episode in progress, as an immutable state machine: every function
 * returns a new Run (or the same one when nothing changes), never mutates.
 *
 *   startRun → [action] --completeStage--> [choice] --chooseOption--> [action] … → finished
 *
 * Timer model: `elapsedMs` holds closed segments; `runningSince` opens the
 * current one. Paused time is never counted.
 */
import { getEnding, getNode } from '../../shared/graph.ts';
import { cleanNote, renderTemplate } from '../../shared/template.ts';
import type { Adventure, Ending, Prefs, StageNode } from '../../shared/types.ts';
import { computeAward } from './progression.ts';
import { hashSeed, makeId } from './random.ts';
import type { CompletedEpisode, PathStepSummary, Run, StepRecord } from './types.ts';

const MINUTE_MS = 60_000;
const STAGE_COUNT = 3;
/** Floor of the default away allowance; see `recoverRun`. */
const MIN_AWAY_MS = 45 * MINUTE_MS;
const MAX_JOURNAL_LENGTH = 280;

export function startRun(adv: Adventure, prefs: Prefs, episodeNumber: number, now: number, id: string = makeId('run')): Run {
  if (!getNode(adv, adv.start)) throw new Error(`Adventure "${adv.id}" has no start node "${adv.start}"`);
  return {
    id,
    episodeNumber,
    // A detached snapshot: the run must survive library edits and outlive AI episodes.
    adventure: structuredClone(adv),
    prefs: { ...prefs },
    startedAt: now,
    elapsedMs: 0,
    runningSince: now,
    lastSeenAt: now,
    nodeId: adv.start,
    phase: 'action',
    usingAlternative: false,
    steps: [],
    notes: {},
    endingId: null,
    finishedAt: null,
  };
}

// ── clock ────────────────────────────────────────────────────────────

export function elapsedMs(run: Run, now: number): number {
  // Clamped so a clock that jumps backwards never subtracts time.
  const open = run.runningSince === null ? 0 : Math.max(0, now - run.runningSince);
  return run.elapsedMs + open;
}

export function isFinished(run: Run): boolean {
  return run.finishedAt !== null;
}

export function isPaused(run: Run): boolean {
  return !isFinished(run) && run.runningSince === null;
}

export function pauseRun(run: Run, now: number): Run {
  if (isFinished(run) || run.runningSince === null) return run;
  return { ...run, elapsedMs: elapsedMs(run, now), runningSince: null, lastSeenAt: now };
}

export function resumeRun(run: Run, now: number): Run {
  if (isFinished(run) || run.runningSince !== null) return run;
  return { ...run, runningSince: now, lastSeenAt: now };
}

export function touchRun(run: Run, now: number): Run {
  return run.lastSeenAt === now ? run : { ...run, lastSeenAt: now };
}

/**
 * Call after a reload. Phones lock while people do the activity, so ordinary
 * time away keeps counting. Only an absence longer than `maxAwayMs` (default
 * max(45 min, 2 × the episode's minutes)) is treated as "left it running":
 * at most `maxAwayMs` of it is credited and the run is paused.
 */
export function recoverRun(run: Run, now: number, maxAwayMs?: number): { run: Run; autoPaused: boolean } {
  const limit =
    typeof maxAwayMs === 'number' && !Number.isNaN(maxAwayMs)
      ? Math.max(0, maxAwayMs)
      : Math.max(MIN_AWAY_MS, 2 * run.adventure.minutes * MINUTE_MS);
  const running = !isFinished(run) && run.runningSince !== null;
  if (!running || now - run.lastSeenAt <= limit) return { run: touchRun(run, now), autoPaused: false };

  const credited = Math.min(elapsedMs(run, now), elapsedMs(run, run.lastSeenAt) + limit);
  return { run: { ...run, elapsedMs: credited, runningSince: null, lastSeenAt: now }, autoPaused: true };
}

// ── stages & choices ─────────────────────────────────────────────────

export function currentNode(run: Run): StageNode | null {
  return getNode(run.adventure, run.nodeId) ?? null;
}

/** Switches between the main action and the alternative challenge (only while doing a stage). */
export function toggleAlternative(run: Run): Run {
  if (isFinished(run) || run.phase !== 'action') return run;
  return { ...run, usingAlternative: !run.usingAlternative };
}

/**
 * Stores a cleaned field note (an empty note removes the key). Keys that are
 * not capture keys of this adventure are ignored. Works in any phase, also after
 * the finish (until `completeEpisode`). The value is trimmed, so call this on
 * commit (blur / submit), not on every keystroke.
 */
export function setNote(run: Run, key: string, value: string): Run {
  if (!run.adventure.nodes.some((n) => n.capture?.key === key)) return run;
  // cleanNote deletes tabs/newlines outright; make them spaces first so words don't merge.
  const note = cleanNote(value.replace(/\s+/g, ' '));
  if ((run.notes[key] ?? '') === note) return run;
  const notes = { ...run.notes };
  if (note) notes[key] = note;
  else delete notes[key];
  return { ...run, notes };
}

type Target = { kind: 'node'; node: StageNode } | { kind: 'ending'; ending: Ending };

function resolveTarget(adv: Adventure, id: string | undefined): Target | null {
  if (!id) return null;
  const node = getNode(adv, id);
  if (node) return { kind: 'node', node };
  const ending = getEnding(adv, id);
  return ending ? { kind: 'ending', ending } : null;
}

function advance(run: Run, target: Target, now: number): Run {
  if (target.kind === 'node') return { ...run, nodeId: target.node.id, phase: 'action', usingAlternative: false };
  return {
    ...run,
    phase: 'action',
    endingId: target.ending.id,
    finishedAt: now,
    elapsedMs: elapsedMs(run, now),
    runningSince: null,
  };
}

/**
 * Marks the current stage's action done. A node with a choice moves to the
 * `choice` phase (clock keeps running); otherwise the run follows `next`.
 * A paused run resumes implicitly: doing the task means you're playing.
 */
export function completeStage(run: Run, now: number): Run {
  if (isFinished(run) || run.phase !== 'action') return run;
  const node = currentNode(run);
  if (!node) return run;
  const target = node.choice ? null : resolveTarget(run.adventure, node.next);
  if (!node.choice && !target) return run;

  const step: StepRecord = { nodeId: node.id, stage: node.stage, usedAlternative: run.usingAlternative, completedAt: now };
  const recorded: Run = { ...resumeRun(run, now), steps: [...run.steps, step], lastSeenAt: now };
  return target ? advance(recorded, target, now) : { ...recorded, phase: 'choice' };
}

/** Picks a branch (choice phase only); unknown options are ignored. */
export function chooseOption(run: Run, optionId: string, now: number): Run {
  if (isFinished(run) || run.phase !== 'choice') return run;
  const node = currentNode(run);
  const option = node?.choice?.options.find((o) => o.id === optionId);
  const target = option ? resolveTarget(run.adventure, option.next) : null;
  const last = run.steps.at(-1);
  if (!node || !option || !target || !last || last.nodeId !== node.id) return run;

  const steps = [...run.steps.slice(0, -1), { ...last, optionId: option.id }];
  return advance({ ...resumeRun(run, now), steps, lastSeenAt: now }, target, now);
}

// ── summaries ────────────────────────────────────────────────────────

/** Completed stages / 3, and 1 once finished. */
export function progressFraction(run: Run): number {
  if (isFinished(run)) return 1;
  const node = currentNode(run);
  const done = node ? node.stage - 1 + (run.phase === 'choice' ? 1 : 0) : run.steps.length;
  return Math.min(1, Math.max(0, done / STAGE_COUNT));
}

function summarizeStep(step: StepRecord, node: StageNode, notes: Record<string, string>): PathStepSummary {
  const summary: PathStepSummary = {
    stage: step.stage,
    nodeId: node.id,
    title: node.title,
    action: renderTemplate(step.usedAlternative ? node.alternative : node.action, notes),
    usedAlternative: step.usedAlternative,
  };
  const option = step.optionId === undefined ? undefined : node.choice?.options.find((o) => o.id === step.optionId);
  if (node.choice && option) {
    summary.choicePrompt = renderTemplate(node.choice.prompt, notes);
    summary.choiceLabel = option.label;
  }
  const note = node.capture ? notes[node.capture.key] : undefined;
  if (node.capture && note) {
    summary.noteLabel = node.capture.label;
    summary.note = note;
  }
  return summary;
}

/** The path actually played, one entry per completed stage. */
export function pathSummary(run: Run): PathStepSummary[] {
  return run.steps.flatMap((step) => {
    const node = getNode(run.adventure, step.nodeId);
    return node ? [summarizeStep(step, node, run.notes)] : [];
  });
}

function cleanJournal(text: string): string {
  const printable = Array.from(text)
    .filter((ch) => {
      const code = ch.codePointAt(0) ?? 0;
      return /\s/.test(ch) || (code >= 0x20 && code !== 0x7f);
    })
    .join('');
  const chars = Array.from(printable.replace(/\s+/g, ' ').trim());
  if (chars.length <= MAX_JOURNAL_LENGTH) return chars.join('');
  return `${chars.slice(0, MAX_JOURNAL_LENGTH - 1).join('').trimEnd()}…`;
}

/** Turns a finished run into a collection entry. Throws for unfinished runs (a programming error). */
export function completeEpisode(run: Run, now: number, journal = ''): CompletedEpisode {
  if (!isFinished(run) || run.endingId === null) throw new Error(`Run "${run.id}" is not finished yet`);
  const adv = run.adventure;
  const ending = getEnding(adv, run.endingId);
  if (!ending) throw new Error(`Run "${run.id}" ended at unknown ending "${run.endingId}"`);

  const choices = run.steps.flatMap((s) => (s.optionId === undefined ? [] : [{ nodeId: s.nodeId, optionId: s.optionId }]));
  const episode: CompletedEpisode = {
    id: run.id,
    episodeNumber: run.episodeNumber,
    adventureId: adv.id,
    source: adv.source,
    title: adv.title,
    tagline: adv.tagline,
    kind: adv.kind,
    palette: adv.palette,
    motif: adv.motif,
    weirdness: adv.weirdness,
    minutesEstimate: adv.minutes,
    prefs: { ...run.prefs },
    startedAt: run.startedAt,
    completedAt: now,
    elapsedMs: elapsedMs(run, now),
    steps: pathSummary(run),
    endingId: ending.id,
    endingTitle: ending.title,
    twist: renderTemplate(ending.twist, run.notes),
    closingLine: renderTemplate(ending.closingLine, run.notes),
    notes: { ...run.notes },
    award: computeAward(adv, choices, ending.id),
    journal: cleanJournal(journal),
    posterSeed: hashSeed(run.id, adv.id, ending.id),
  };
  if (adv.narrator) episode.narrator = adv.narrator;
  return episode;
}
