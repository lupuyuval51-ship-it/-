/**
 * localStorage persistence. Storage can be missing, blocked (private mode,
 * disabled site data), full, or hold anything at all — every access is guarded
 * and everything read back is sanitized before the app sees it.
 */
import {
  BUDGET_OPTIONS,
  COMPANY_OPTIONS,
  DEFAULT_PREFS,
  KINDS,
  MINUTES_OPTIONS,
  MOOD_OPTIONS,
  MOTIFS,
  PALETTE_NAMES,
  SETTING_OPTIONS,
  TRAITS,
  WEIRDNESS_OPTIONS,
} from '../../shared/constants.ts';
import { cleanNote } from '../../shared/template.ts';
import type { Adventure, AdventureSource, Prefs, TraitPoints } from '../../shared/types.ts';
import { validateAdventure } from '../../shared/validate.ts';
import { emptyTraits } from '../engine/progression.ts';
import { hashSeed } from '../engine/random.ts';
import type { Award, AwardLine, CompletedEpisode, PathStepSummary, Run, StepRecord } from '../engine/types.ts';
import { SECTIONS } from './types.ts';
import type {
  Draw,
  DrawEnvelope,
  EnvelopeStatus,
  LoadResult,
  MotionPreference,
  PersistedState,
  SaveResult,
  SectionStamps,
  StorageLike,
} from './types.ts';

export const STORAGE_KEY = 'plot-twist:v1';
/** Where an unreadable save is copied before starting fresh, so it can still be recovered by hand. */
export const CORRUPT_BACKUP_KEY = 'plot-twist:corrupt';

const MAX_SERIES_NAME_LENGTH = 120;
const MAX_DETAIL_LENGTH = 140;
/** Same shape as capture keys; also keeps keys like "__proto__" out of note maps. */
const NOTE_KEY = /^[a-z0-9][a-z0-9-]{0,31}$/;

const MESSAGES = {
  unavailable: "This browser isn't letting PLOT TWIST save right now, so progress will only last until you close the tab.",
  resetBackedUp: "Your saved progress couldn't be read, so PLOT TWIST started fresh. A copy of the old data was kept on this device.",
  reset: "Your saved progress couldn't be read, so PLOT TWIST started fresh.",
  repaired: 'Some saved details were damaged and have been tidied up. Everything else is right where you left it.',
} as const;

export function defaultState(now: number = Date.now()): PersistedState {
  return {
    version: 1,
    prefs: { ...DEFAULT_PREFS },
    draw: null,
    run: null,
    completed: [],
    series: { name: null, namePromptDone: false },
    settings: { motion: 'system' },
    updatedAt: now,
  };
}

// ── storage access ───────────────────────────────────────────────────

/** window.localStorage, or null when it is missing or throws on access. Never writes. */
export function getBrowserStorage(): StorageLike | null {
  try {
    if (typeof window === 'undefined') return null;
    const storage = window.localStorage;
    if (!storage) return null;
    // Some browsers only throw on first use. A read probe: a full storage must still load.
    storage.getItem(STORAGE_KEY);
    return storage;
  } catch {
    return null;
  }
}

function isQuotaError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const { name, code } = err as { name?: unknown; code?: unknown };
  return name === 'QuotaExceededError' || name === 'NS_ERROR_DOM_QUOTA_REACHED' || code === 22 || code === 1014;
}

function isAccessError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const { name } = err as { name?: unknown };
  return name === 'SecurityError' || name === 'InvalidAccessError';
}

function backupCorrupt(storage: StorageLike, text: string): boolean {
  try {
    storage.setItem(CORRUPT_BACKUP_KEY, text);
    return true;
  } catch {
    return false;
  }
}

export function loadState(storage: StorageLike | null = getBrowserStorage(), now: number = Date.now()): LoadResult {
  const unavailable: LoadResult = { state: defaultState(now), status: 'unavailable', message: MESSAGES.unavailable };
  if (!storage) return unavailable;

  let text: unknown;
  try {
    text = storage.getItem(STORAGE_KEY);
  } catch {
    return unavailable;
  }
  if (typeof text !== 'string') return { state: defaultState(now), status: 'fresh' };

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = undefined;
  }
  if (!isObj(parsed)) {
    const backedUp = backupCorrupt(storage, text);
    return { state: defaultState(now), status: 'reset-corrupt', message: backedUp ? MESSAGES.resetBackedUp : MESSAGES.reset };
  }

  const { state, repaired } = sanitizeState(parsed, now);
  return repaired ? { state, status: 'repaired', message: MESSAGES.repaired } : { state, status: 'loaded' };
}

export function saveState(state: PersistedState, storage: StorageLike | null = getBrowserStorage(), now: number = Date.now()): SaveResult {
  if (!storage) return { ok: false, reason: 'unavailable' };
  let text: string;
  try {
    text = JSON.stringify({ ...state, updatedAt: now });
  } catch {
    return { ok: false, reason: 'unknown' };
  }
  try {
    storage.setItem(STORAGE_KEY, text);
    return { ok: true };
  } catch (err) {
    if (isQuotaError(err)) return { ok: false, reason: 'quota' };
    return { ok: false, reason: isAccessError(err) ? 'unavailable' : 'unknown' };
  }
}

export function clearState(storage: StorageLike | null = getBrowserStorage()): void {
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing we can do; the next save overwrites it anyway.
  }
}

// ── sanitizing ───────────────────────────────────────────────────────

type Obj = Record<string, unknown>;

/** Collects whether anything had to be dropped or fixed. */
interface Repairs {
  repaired: boolean;
}

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const isFiniteNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isNonEmptyString = (v: unknown): v is string => typeof v === 'string' && v.length > 0;
const isPositiveInteger = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v > 0;
const isOneOf = <T>(v: unknown, allowed: readonly T[]): v is T => (allowed as readonly unknown[]).includes(v);

function fixed<T>(r: Repairs, value: T): T {
  r.repaired = true;
  return value;
}

/** Runs one section's sanitizer; if it throws (exotic input), only that section falls back. */
function attempt<T>(r: Repairs, fallback: T, fn: () => T): T {
  try {
    return fn();
  } catch {
    return fixed(r, fallback);
  }
}

function validAdventure(raw: unknown): Adventure | null {
  return validateAdventure(raw).ok ? (raw as Adventure) : null;
}

function sanitizePrefs(raw: unknown, fallback: Prefs, r: Repairs): Prefs {
  if (!isObj(raw)) return fixed(r, { ...fallback });
  const field = <K extends keyof Prefs>(key: K, allowed: readonly Prefs[K][]): Prefs[K] => {
    const value = raw[key];
    return isOneOf(value, allowed) ? value : fixed(r, fallback[key]);
  };
  return {
    minutes: field('minutes', MINUTES_OPTIONS),
    budget: field('budget', BUDGET_OPTIONS),
    setting: field('setting', SETTING_OPTIONS),
    company: field('company', COMPANY_OPTIONS),
    mood: field('mood', MOOD_OPTIONS),
    weirdness: field('weirdness', WEIRDNESS_OPTIONS),
  };
}

/** Cleaned string notes; keys outside `allowedKeys` (when given) are dropped. */
function sanitizeNotes(raw: unknown, r: Repairs, allowedKeys?: ReadonlySet<string>): Record<string, string> {
  if (!isObj(raw)) return fixed(r, {});
  const notes: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    const allowed = allowedKeys ? allowedKeys.has(key) : NOTE_KEY.test(key);
    const note = typeof value === 'string' ? cleanNote(value) : '';
    if (!allowed || note === '' || note !== value) r.repaired = true;
    if (allowed && note) notes[key] = note;
  }
  return notes;
}

// draw

const ENVELOPE_STATUSES: readonly EnvelopeStatus[] = ['ready', 'writing', 'failed'];
const SOURCES: readonly AdventureSource[] = ['curated', 'ai'];

function sanitizeEnvelope(raw: Obj, index: number, r: Repairs): DrawEnvelope {
  const slot = typeof raw.slot === 'number' && Number.isInteger(raw.slot) && raw.slot >= 0 ? raw.slot : fixed(r, index);
  const adventure = raw.adventure === null ? null : validAdventure(raw.adventure);
  const source = isOneOf(raw.source, SOURCES) ? raw.source : fixed(r, adventure?.source ?? 'curated');
  const opened = typeof raw.opened === 'boolean' ? raw.opened : fixed(r, false);

  let status: EnvelopeStatus = isOneOf(raw.status, ENVELOPE_STATUSES) ? raw.status : fixed(r, 'failed');
  if (raw.adventure !== null && adventure === null) status = fixed(r, 'failed'); // present but invalid → dropped
  else if (adventure && status !== 'ready') status = fixed(r, 'ready');
  else if (!adventure && status === 'ready') status = fixed(r, 'failed');

  const envelope: DrawEnvelope = { slot, status, source, adventure, opened };
  if (typeof raw.note === 'string') envelope.note = raw.note;
  else if (raw.note !== undefined) r.repaired = true;
  return envelope;
}

function sanitizeDraw(raw: unknown, fallbackPrefs: Prefs, now: number, r: Repairs): Draw | null {
  if (raw === null) return null;
  if (!isObj(raw) || !isNonEmptyString(raw.id) || !Array.isArray(raw.envelopes)) return fixed(r, null);
  const envelopes = raw.envelopes.flatMap((env, i) => (isObj(env) ? [sanitizeEnvelope(env, i, r)] : fixed(r, [])));
  const shownIds = Array.isArray(raw.shownIds)
    ? raw.shownIds.filter((id): id is string => (typeof id === 'string' ? true : fixed(r, false)))
    : fixed(r, []);
  const draw: Draw = {
    id: raw.id,
    createdAt: isFiniteNumber(raw.createdAt) ? raw.createdAt : fixed(r, now),
    prefs: sanitizePrefs(raw.prefs, fallbackPrefs, r),
    seed: isFiniteNumber(raw.seed) ? raw.seed : fixed(r, 0),
    envelopes,
    shownIds,
  };
  if (typeof raw.detail === 'string') {
    const detail = raw.detail.slice(0, MAX_DETAIL_LENGTH);
    if (detail !== raw.detail) r.repaired = true;
    if (detail.trim()) draw.detail = detail;
  } else if (raw.detail !== undefined) r.repaired = true;
  return draw;
}

// run

function parseStep(raw: unknown, adv: Adventure): StepRecord | null {
  if (!isObj(raw) || typeof raw.nodeId !== 'string') return null;
  const node = adv.nodes.find((n) => n.id === raw.nodeId);
  if (!node || raw.stage !== node.stage || typeof raw.usedAlternative !== 'boolean' || !isFiniteNumber(raw.completedAt)) {
    return null;
  }
  const step: StepRecord = { nodeId: node.id, stage: node.stage, usedAlternative: raw.usedAlternative, completedAt: raw.completedAt };
  if (raw.optionId === undefined) return step;
  const option = node.choice?.options.find((o) => o.id === raw.optionId);
  return option ? { ...step, optionId: option.id } : null;
}

/** A run is only kept when it is fully consistent; anything else is discarded (null). */
function parseRun(raw: Obj, fallbackPrefs: Prefs, r: Repairs): Run | null {
  const adventure = validAdventure(raw.adventure);
  if (!adventure || !isNonEmptyString(raw.id) || !isPositiveInteger(raw.episodeNumber)) return null;
  if (!isFiniteNumber(raw.startedAt) || !isFiniteNumber(raw.lastSeenAt)) return null;
  if (!isFiniteNumber(raw.elapsedMs) || raw.elapsedMs < 0) return null;
  if (raw.runningSince !== null && !isFiniteNumber(raw.runningSince)) return null;
  if (typeof raw.usingAlternative !== 'boolean') return null;

  const node = adventure.nodes.find((n) => n.id === raw.nodeId);
  if (!node || (raw.phase !== 'action' && raw.phase !== 'choice')) return null;
  if (raw.phase === 'choice' && !node.choice) return null;

  const finished = raw.finishedAt !== null || raw.endingId !== null;
  if (finished) {
    const ending = adventure.endings.find((e) => e.id === raw.endingId);
    if (!ending || !isFiniteNumber(raw.finishedAt) || raw.runningSince !== null) return null;
  }

  if (!Array.isArray(raw.steps)) return null;
  const steps: StepRecord[] = [];
  for (const rawStep of raw.steps) {
    const step = parseStep(rawStep, adventure);
    if (!step) return null;
    steps.push(step);
  }

  const captureKeys = new Set(adventure.nodes.flatMap((n) => (n.capture ? [n.capture.key] : [])));
  return {
    id: raw.id,
    episodeNumber: raw.episodeNumber,
    adventure,
    prefs: sanitizePrefs(raw.prefs, fallbackPrefs, r),
    startedAt: raw.startedAt,
    elapsedMs: raw.elapsedMs,
    runningSince: raw.runningSince,
    lastSeenAt: raw.lastSeenAt,
    nodeId: node.id,
    phase: raw.phase,
    usingAlternative: raw.usingAlternative,
    steps,
    notes: sanitizeNotes(raw.notes, r, captureKeys),
    endingId: finished ? (raw.endingId as string) : null,
    finishedAt: finished ? (raw.finishedAt as number) : null,
  };
}

function sanitizeRun(raw: unknown, fallbackPrefs: Prefs, r: Repairs): Run | null {
  if (raw === null) return null;
  const run = isObj(raw) ? parseRun(raw, fallbackPrefs, r) : null;
  return run ?? fixed(r, null);
}

// completed episodes

function sanitizeTraitPoints(raw: unknown, r: Repairs): TraitPoints {
  if (!isObj(raw)) return fixed(r, emptyTraits());
  const points = emptyTraits();
  for (const trait of TRAITS) {
    const value = raw[trait];
    points[trait] = isFiniteNumber(value) && value >= 0 ? value : fixed(r, 0);
  }
  if (Object.keys(raw).some((k) => !isOneOf(k, TRAITS))) r.repaired = true;
  return points;
}

const AWARD_SOURCES: readonly AwardLine['source'][] = ['episode', 'choice', 'ending'];

function sanitizeAward(raw: unknown, r: Repairs): Award {
  if (!isObj(raw)) return fixed(r, { points: emptyTraits(), lines: [] });
  const points = sanitizeTraitPoints(raw.points, r);
  if (!Array.isArray(raw.lines)) return fixed(r, { points, lines: [] });
  const lines = raw.lines.flatMap((line): AwardLine[] =>
    isObj(line) &&
    isOneOf(line.trait, TRAITS) &&
    isFiniteNumber(line.points) &&
    isOneOf(line.source, AWARD_SOURCES) &&
    typeof line.label === 'string'
      ? [{ trait: line.trait, points: line.points, source: line.source, label: line.label }]
      : fixed(r, []),
  );
  return { points, lines };
}

const OPTIONAL_STEP_TEXT = ['choicePrompt', 'choiceLabel', 'noteLabel', 'note'] as const;

function sanitizeStepSummary(raw: unknown, r: Repairs): PathStepSummary | null {
  if (!isObj(raw)) return null;
  if (!isOneOf(raw.stage, [1, 2, 3] as const)) return null;
  if (typeof raw.nodeId !== 'string' || typeof raw.title !== 'string' || typeof raw.action !== 'string') return null;
  const step: PathStepSummary = {
    stage: raw.stage,
    nodeId: raw.nodeId,
    title: raw.title,
    action: raw.action,
    usedAlternative: typeof raw.usedAlternative === 'boolean' ? raw.usedAlternative : fixed(r, false),
  };
  for (const key of OPTIONAL_STEP_TEXT) {
    const value = raw[key];
    if (typeof value === 'string') step[key] = value;
    else if (value !== undefined) r.repaired = true;
  }
  return step;
}

/** Required fields missing or invalid → null (the entry is dropped). Everything else is repaired. */
function parseCompleted(raw: unknown, fallbackPrefs: Prefs, r: Repairs): CompletedEpisode | null {
  if (!isObj(raw)) return null;
  const { id, adventureId, title, endingId, endingTitle, closingLine, completedAt, episodeNumber } = raw;
  if (!isNonEmptyString(id) || !isNonEmptyString(adventureId) || !isNonEmptyString(endingId)) return null;
  if (!isNonEmptyString(title) || !isNonEmptyString(endingTitle) || typeof closingLine !== 'string') return null;
  if (!isFiniteNumber(completedAt) || !isPositiveInteger(episodeNumber)) return null;
  if (!isOneOf(raw.source, SOURCES) || !isOneOf(raw.kind, KINDS)) return null;
  if (!isOneOf(raw.palette, PALETTE_NAMES) || !isOneOf(raw.motif, MOTIFS) || !isOneOf(raw.weirdness, WEIRDNESS_OPTIONS)) {
    return null;
  }

  const steps = Array.isArray(raw.steps)
    ? raw.steps.flatMap((s) => {
        const step = sanitizeStepSummary(s, r);
        return step ? [step] : fixed(r, []);
      })
    : fixed(r, []);

  const episode: CompletedEpisode = {
    id,
    episodeNumber,
    adventureId,
    source: raw.source,
    title,
    tagline: typeof raw.tagline === 'string' ? raw.tagline : fixed(r, ''),
    kind: raw.kind,
    palette: raw.palette,
    motif: raw.motif,
    weirdness: raw.weirdness,
    minutesEstimate: isFiniteNumber(raw.minutesEstimate) && raw.minutesEstimate >= 0 ? raw.minutesEstimate : fixed(r, 0),
    prefs: sanitizePrefs(raw.prefs, fallbackPrefs, r),
    startedAt: isFiniteNumber(raw.startedAt) ? raw.startedAt : fixed(r, completedAt),
    completedAt,
    elapsedMs: isFiniteNumber(raw.elapsedMs) && raw.elapsedMs >= 0 ? raw.elapsedMs : fixed(r, 0),
    steps,
    endingId,
    endingTitle,
    twist: typeof raw.twist === 'string' ? raw.twist : fixed(r, ''),
    closingLine,
    notes: sanitizeNotes(raw.notes, r),
    award: sanitizeAward(raw.award, r),
    journal: typeof raw.journal === 'string' ? raw.journal : fixed(r, ''),
    posterSeed: isFiniteNumber(raw.posterSeed) ? raw.posterSeed : fixed(r, hashSeed(id, adventureId, endingId)),
  };
  if (typeof raw.narrator === 'string') episode.narrator = raw.narrator;
  else if (raw.narrator !== undefined) r.repaired = true;
  if (typeof raw.stageLabel === 'string' && raw.stageLabel.trim()) episode.stageLabel = raw.stageLabel.slice(0, 24);
  else if (raw.stageLabel !== undefined) r.repaired = true;
  return episode;
}

function sanitizeCompleted(raw: unknown, fallbackPrefs: Prefs, r: Repairs): CompletedEpisode[] {
  if (!Array.isArray(raw)) return fixed(r, []);
  const seen = new Set<string>();
  const out: CompletedEpisode[] = [];
  for (const item of raw) {
    const episode = attempt(r, null, () => parseCompleted(item, fallbackPrefs, r));
    if (!episode || seen.has(episode.id)) {
      r.repaired = true;
      continue;
    }
    seen.add(episode.id);
    out.push(episode);
  }
  return out;
}

// series & settings

function sanitizeSeries(raw: unknown, r: Repairs): PersistedState['series'] {
  if (!isObj(raw)) return fixed(r, { name: null, namePromptDone: false });
  let name: string | null = null;
  if (typeof raw.name === 'string' && raw.name.trim()) {
    const chars = Array.from(raw.name);
    name = chars.length <= MAX_SERIES_NAME_LENGTH ? raw.name : fixed(r, chars.slice(0, MAX_SERIES_NAME_LENGTH).join(''));
  } else if (raw.name !== null) {
    r.repaired = true;
  }
  const namePromptDone = typeof raw.namePromptDone === 'boolean' ? raw.namePromptDone : fixed(r, name !== null);
  return { name, namePromptDone };
}

const MOTION_PREFERENCES: readonly MotionPreference[] = ['system', 'reduce', 'full'];

function sanitizeStamps(raw: unknown, r: Repairs): SectionStamps | undefined {
  if (raw === undefined) return undefined;
  if (!isObj(raw)) return fixed(r, undefined);
  const stamps: SectionStamps = {};
  for (const key of SECTIONS) {
    const value = raw[key];
    if (isFiniteNumber(value) && value >= 0) stamps[key] = value;
    else if (value !== undefined) r.repaired = true;
  }
  return stamps;
}

function sanitizeSettings(raw: unknown, r: Repairs): PersistedState['settings'] {
  if (!isObj(raw)) return fixed(r, { motion: 'system' });
  return { motion: isOneOf(raw.motion, MOTION_PREFERENCES) ? raw.motion : fixed(r, 'system') };
}

/**
 * Turns anything into a valid PersistedState. Never throws. Invalid fields fall
 * back to defaults; embedded adventures must pass `validateAdventure` (an
 * invalid run is discarded, an invalid envelope becomes failed/null).
 */
export function sanitizeState(raw: unknown, now: number = Date.now()): { state: PersistedState; repaired: boolean } {
  try {
    if (!isObj(raw)) return { state: defaultState(now), repaired: true };
    const r: Repairs = { repaired: raw.version !== 1 };
    const prefs = attempt(r, { ...DEFAULT_PREFS }, () => sanitizePrefs(raw.prefs, DEFAULT_PREFS, r));
    const state: PersistedState = {
      version: 1,
      prefs,
      draw: attempt(r, null, () => sanitizeDraw(raw.draw, prefs, now, r)),
      run: attempt(r, null, () => sanitizeRun(raw.run, prefs, r)),
      completed: attempt(r, [], () => sanitizeCompleted(raw.completed, prefs, r)),
      series: attempt(r, { name: null, namePromptDone: false }, () => sanitizeSeries(raw.series, r)),
      settings: attempt(r, { motion: 'system' as const }, () => sanitizeSettings(raw.settings, r)),
      updatedAt: isFiniteNumber(raw.updatedAt) ? raw.updatedAt : fixed(r, now),
    };
    const stamps = attempt(r, undefined, () => sanitizeStamps(raw.stamps, r));
    if (stamps) state.stamps = stamps;
    if (isFiniteNumber(raw.resetAt) && raw.resetAt > 0) state.resetAt = raw.resetAt;
    else if (raw.resetAt !== undefined) r.repaired = true;
    return { state, repaired: r.repaired };
  } catch {
    return { state: defaultState(now), repaired: true };
  }
}
