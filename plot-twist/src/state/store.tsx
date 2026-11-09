/**
 * App store: persisted state (localStorage) + ephemeral UI state, with the
 * actions that orchestrate matching, runs, AI generation and progression.
 *
 * Persistence rules (see ./sync.ts):
 * - Only this tab's own changes make it write ("dirty"); hiding, closing or
 *   idling never writes a stale snapshot.
 * - What other tabs write is adopted immediately (`storage` events) and re-read
 *   when this tab becomes visible again; if both sides changed, they merge and
 *   completed episodes are a union — an episode is never lost.
 * - "Last seen" for the active run is a separate small key that only moves
 *   while the page is visible, so time away is detected after a refresh or
 *   when the tab was kept open in the background.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import { DirectorError, fetchDirectorStatus, inAbout, requestEpisode, type DirectorEvent, type DirectorStatus } from '../ai/client.ts';
import { getCuratedAdventure, LIBRARY } from '../content/library.ts';
import { matchAdventures } from '../engine/matching.ts';
import { hashSeed, makeId } from '../engine/random.ts';
import {
  chooseOption as engineChoose,
  completeEpisode,
  completeStage as engineComplete,
  isFinished,
  pauseRun,
  recoverRun,
  resumeRun,
  setNote as engineSetNote,
  startRun,
  toggleAlternative as engineToggleAlt,
} from '../engine/run.ts';
import type { CompletedEpisode, MatchResult, Run } from '../engine/types.ts';
import type { Adventure, Prefs } from '../../shared/types.ts';
import { getBrowserStorage, loadState, sanitizeState, saveState, STORAGE_KEY } from './persistence.ts';
import { dealCurated, samePrefs } from './deal.ts';
import {
  AI_BLOCK_KEY,
  clearGenBeat,
  mergeStates,
  ownedElsewhere,
  parseAiBlock,
  readAiBlock,
  readGenBeat,
  readRaw,
  readSeen,
  restamp,
  storedStamp,
  writeAiBlock,
  writeGenBeat,
  writeSeen,
  type AiBlockReason,
} from './sync.ts';
import type { Draw, DrawEnvelope, LoadStatus, MotionPreference, PersistedState } from './types.ts';

// ── ephemeral state ──────────────────────────────────────────────────

export interface Generation {
  drawId: string;
  slot: number;
  phase: 'plotting' | 'writing' | 'checking' | 'repairing';
  /** 0..1 honest estimate based on streamed characters. */
  progress: number;
  title: string | null;
  startedAt: number;
  /** 1 = first draft, 2 = the repair round. */
  round: 1 | 2;
}

export interface Toast {
  id: string;
  message: string;
  tone: 'info' | 'success' | 'warn';
}

export const CHECKING_STATUS: DirectorStatus = {
  configured: false,
  state: 'checking',
  model: '',
  label: 'Checking…',
  detail: 'Checking the connection to the AI Director.',
  canGenerate: false,
  checkedAt: null,
};

export type StorageIssue = null | 'quota' | 'unavailable';

/** Why AI envelopes are paused for this browser (every tab of it). */
export type BlockReason = AiBlockReason;

interface State {
  p: PersistedState;
  loadStatus: LoadStatus;
  loadMessage?: string;
  storageWritable: boolean;
  /** Why the last save failed, if it did. */
  storageIssue: StorageIssue;
  /** The status shown: the server's, limited by this browser's own AI pause. */
  director: DirectorStatus;
  /** The server's status as last fetched. */
  serverDirector: DirectorStatus;
  generation: Generation | null;
  toasts: Toast[];
  /** The latest match result for the current draw (conflict + relaxations). */
  match: MatchResult | null;
  /** Optional free-text detail for the AI Director (stored on the draw once used). */
  detail: string;
  /** The AI Director turned this browser away (rate limit, busy): no AI envelopes until then. */
  aiBlockedUntil: number;
  aiBlockReason: BlockReason | null;
}

type Action =
  | { type: 'setPersisted'; p: PersistedState }
  | { type: 'director'; status: DirectorStatus }
  | { type: 'generation'; generation: Generation | null }
  | { type: 'retargetGeneration'; drawId: string; slot: number }
  | { type: 'endGeneration'; drawId: string; slot: number }
  | { type: 'generationEvent'; drawId: string; event: DirectorEvent }
  | { type: 'match'; match: MatchResult | null }
  | { type: 'toast'; toast: Toast }
  | { type: 'dismissToast'; id: string }
  | { type: 'storage'; writable: boolean; issue: StorageIssue }
  | { type: 'detail'; detail: string }
  | { type: 'aiBlocked'; until: number; reason: BlockReason }
  | { type: 'dismissToasts'; messages: readonly string[] };

function generationReducer(g: Generation, e: DirectorEvent): Generation {
  if (e.type === 'phase') {
    if (e.phase === 'repairing') return { ...g, phase: 'repairing', round: 2, progress: Math.max(0.5, Math.min(g.progress, 0.6)) };
    if (e.phase === 'checking') return { ...g, phase: 'checking', progress: Math.max(g.progress, 0.96) };
    // During the repair round the label stays "Fixing a plot hole…".
    return g.round === 2 ? g : { ...g, phase: e.phase };
  }
  if (e.type === 'progress') {
    const fraction = Math.min(1, e.chars / Math.max(1, e.expected));
    const mapped = g.round === 2 ? 0.5 + 0.45 * fraction : Math.min(0.95, fraction);
    return { ...g, progress: Math.max(g.progress, mapped) };
  }
  if (e.type === 'title') return { ...g, title: e.title };
  return g;
}

const BLOCK_DETAIL: Record<BlockReason, string> = {
  rate_limited: 'Lots of episodes have been asked for from your connection in a short time.',
  busy: 'The AI Director is busy writing for other people right now.',
  connection: 'Other episodes are still being written from your connection.',
  network: 'Too many episodes are being written from your network right now.',
};

/**
 * While the AI Director has turned this browser away for a while (rate limit, busy server,
 * stream caps), the pill and the home copy must not promise an AI envelope, whatever the
 * shared status says — and the details say why, without blaming the visitor for a full server.
 */
export function withClientLimit(status: DirectorStatus, blockedUntil: number, reason: BlockReason | null, now: number): DirectorStatus {
  if (now >= blockedUntil || !status.canGenerate) return status;
  const when = inAbout(blockedUntil - now);
  return {
    ...status,
    state: 'rate_limited',
    label: 'Busy',
    detail: `${BLOCK_DETAIL[reason ?? 'rate_limited']} It will write for you again ${when}; until then all three envelopes come from the curated archive.`,
    canGenerate: false,
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'setPersisted':
      return state.p === action.p ? state : { ...state, p: action.p };
    case 'director':
      return { ...state, serverDirector: action.status, director: withClientLimit(action.status, state.aiBlockedUntil, state.aiBlockReason, Date.now()) };
    case 'aiBlocked':
      return {
        ...state,
        aiBlockedUntil: action.until,
        aiBlockReason: action.reason,
        director: withClientLimit(state.serverDirector, action.until, action.reason, Date.now()),
      };
    case 'generation':
      return { ...state, generation: action.generation };
    case 'retargetGeneration':
      return state.generation ? { ...state, generation: { ...state.generation, drawId: action.drawId, slot: action.slot } } : state;
    case 'endGeneration': {
      const g = state.generation;
      return g && g.drawId === action.drawId && g.slot === action.slot ? { ...state, generation: null } : state;
    }
    case 'generationEvent': {
      const g = state.generation;
      if (!g || g.drawId !== action.drawId) return state;
      const next = generationReducer(g, action.event);
      return next === g ? state : { ...state, generation: next };
    }
    case 'match':
      return { ...state, match: action.match };
    case 'toast':
      return { ...state, toasts: [...state.toasts.filter((t) => t.message !== action.toast.message), action.toast].slice(-3) };
    case 'dismissToast':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) };
    case 'dismissToasts': {
      const toasts = state.toasts.filter((t) => !action.messages.includes(t.message));
      return toasts.length === state.toasts.length ? state : { ...state, toasts };
    }
    case 'storage':
      return state.storageWritable === action.writable && state.storageIssue === action.issue
        ? state
        : { ...state, storageWritable: action.writable, storageIssue: action.issue };
    case 'detail':
      return { ...state, detail: action.detail };
  }
}

// ── helpers ──────────────────────────────────────────────────────────

const MAX_AI_DETAIL = 140;
/** Taps on a new stage/choice closer together than this are treated as one (double-tap guard). */
const TRANSITION_GUARD_MS = 350;
const HEARTBEAT_MS = 15_000;

const WELCOME_BACK = 'Welcome back — we paused the clock while you were away.';
/** Shown when leaving a running episode for another screen (it pauses). */
export const PAUSED_WHILE_BROWSING = 'Episode paused while you look around. Resume it from the home screen.';
const SAVED_PAUSED = 'Saved. Your episode is paused right where you left it.';
/** Notices that say the episode is paused: stale the moment it runs again. */
const PAUSE_NOTICES = [WELCOME_BACK, PAUSED_WHILE_BROWSING, SAVED_PAUSED] as const;

function historyOf(completed: readonly CompletedEpisode[]) {
  return completed.map((c) => ({ adventureId: c.adventureId, completedAt: c.completedAt }));
}

function isRunning(run: Run | null): run is Run {
  return Boolean(run && !isFinished(run) && run.runningSince !== null);
}

/** Only the tab that shows the episode counts as "seeing" it. */
function onPlayRoute(): boolean {
  return window.location.hash.startsWith('#/play');
}

/** Monotonic clock for tap guards (a wall-clock step backwards must not lock the buttons). */
const monotonic = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

const TAB_ID = makeId('tab');

/** The next episode number: one past the highest so far (robust to gaps and merges). */
function nextEpisodeNumber(completed: readonly CompletedEpisode[]): number {
  return completed.reduce((max, c) => Math.max(max, c.episodeNumber), 0) + 1;
}

/** Picks a curated fallback for an AI slot that failed, avoiding what's already on the table. */
function fallbackFor(draw: Draw, completed: readonly CompletedEpisode[]): Adventure | null {
  const onTable = draw.envelopes.flatMap((e) => (e.adventure ? [e.adventure.id] : []));
  const exclude = Array.from(new Set([...onTable, ...draw.shownIds]));
  const tries = [exclude, onTable];
  for (const ex of tries) {
    const r = matchAdventures(LIBRARY, draw.prefs, { history: historyOf(completed), exclude: ex, count: 1, seed: draw.seed + 7 });
    if (r.picks[0]) return r.picks[0].adventure;
  }
  return null;
}

/** An archive pick that stands in for the AI envelope counts as shown, like the rest of the table. */
function markShown(draw: Draw, adventure: Adventure | null | undefined): Draw {
  if (!adventure || draw.shownIds.includes(adventure.id)) return draw;
  return { ...draw, shownIds: [...draw.shownIds, adventure.id] };
}

/** Swaps every envelope still marked "writing" for a curated pick (with an honest note). */
function settleWriting(p: PersistedState, note: string): PersistedState {
  const draw = p.draw;
  if (!draw || !draw.envelopes.some((e) => e.status === 'writing')) return p;
  let working: Draw = { ...draw, envelopes: [...draw.envelopes] };
  for (const env of draw.envelopes) {
    if (env.status !== 'writing') continue;
    const fb = fallbackFor(working, p.completed);
    const next: DrawEnvelope = fb
      ? { ...env, status: 'ready', source: 'curated', adventure: fb, opened: false, note: `${note} Here is an archive pick instead.` }
      : { ...env, status: 'failed', adventure: null, note };
    working = markShown({ ...working, envelopes: working.envelopes.map((e) => (e.slot === env.slot ? next : e)) }, fb);
  }
  return { ...p, draw: working };
}

interface Boot {
  state: State;
  /** updatedAt of the stored copy this tab started from. */
  stamp: number | null;
  /** True when booting changed the state (it must be written). */
  dirty: boolean;
  startupToast: string | null;
}

function bootState(): Boot {
  const storage = getBrowserStorage();
  const loaded = loadState(storage);
  const stamp = loaded.status === 'loaded' || loaded.status === 'repaired' ? loaded.state.updatedAt : null;
  let p = loaded.state;
  let startupToast: string | null = null;
  // A pause the AI Director asked for in another tab (or before a reload) still holds.
  const block = readAiBlock(storage, Date.now());
  if (isRunning(p.run)) {
    const seen = Math.max(p.run.lastSeenAt, readSeen(storage, p.run.id) ?? 0);
    const { run, autoPaused } = recoverRun({ ...p.run, lastSeenAt: seen }, Date.now());
    if (autoPaused) {
      p = { ...p, run };
      startupToast = WELCOME_BACK;
    }
  }
  return {
    state: {
      p,
      loadStatus: loaded.status,
      loadMessage: loaded.message,
      storageWritable: storage !== null && loaded.status !== 'unavailable',
      storageIssue: storage === null || loaded.status === 'unavailable' ? 'unavailable' : null,
      director: CHECKING_STATUS,
      serverDirector: CHECKING_STATUS,
      generation: null,
      toasts: [],
      match: null,
      detail: '',
      aiBlockedUntil: block?.until ?? 0,
      aiBlockReason: block?.reason ?? null,
    },
    stamp,
    dirty: p !== loaded.state,
    startupToast,
  };
}

// ── context ──────────────────────────────────────────────────────────

export interface StoreApi {
  state: State;
  setPrefs: (prefs: Prefs) => void;
  setDetail: (detail: string) => void;
  drawEnvelopes: (prefs?: Prefs) => void;
  reshuffle: () => void;
  openEnvelope: (slot: number) => void;
  retryAiEnvelope: (slot: number) => void;
  startEpisode: (slot: number) => Run | null;
  abandonRun: () => void;
  pause: () => void;
  resume: () => void;
  toggleAlternative: () => void;
  setNote: (key: string, value: string) => void;
  completeStage: () => CompletedEpisode | null;
  choose: (optionId: string) => CompletedEpisode | null;
  saveAndExit: () => void;
  setJournal: (episodeId: string, journal: string) => void;
  setSeriesName: (name: string | null) => void;
  dismissNamePrompt: () => void;
  setMotion: (motion: MotionPreference) => void;
  resetAll: () => void;
  /** Forces a fresh check; resolves with the status shown afterwards (null if the check failed). */
  refreshDirector: () => Promise<DirectorStatus | null>;
  toast: (message: string, tone?: Toast['tone']) => void;
  dismissToast: (id: string) => void;
  /**
   * Registers a commit function for an input whose text is not saved yet
   * (field notes, journal). It runs right before the store saves when the page
   * hides or unloads. Returns the unregister function.
   */
  registerDraft: (commit: () => void) => () => void;
}

const StoreContext = createContext<StoreApi | null>(null);

interface GenTarget {
  ctl: AbortController;
  drawId: string;
  slot: number;
  /** The envelope being written (its genKey), wherever a re-deal moves it. */
  key: string;
  /** This generation's beat. */
  token: string;
}

/** The envelope a generation writes, by its key (older stored envelopes have none: by place). */
function writingFor(draw: Draw | null, g: { key: string; drawId: string; slot: number }): DrawEnvelope | null {
  if (!draw) return null;
  return draw.envelopes.find((e) => e.status === 'writing' && (e.genKey ? e.genKey === g.key : draw.id === g.drawId && e.slot === g.slot)) ?? null;
}

/** How long a takeover claim must stand before this tab writes the envelope. */
const CLAIM_SETTLE_MS = 450;

export function StoreProvider({ children }: { children: ReactNode }) {
  const boot = useRef<Boot | null>(null);
  if (boot.current === null) boot.current = bootState();
  const [state, dispatch] = useReducer(reducer, boot.current.state);
  const stateRef = useRef(state);
  stateRef.current = state;

  /**
   * The freshest persisted state. Updates apply here synchronously, so actions
   * fired in the same tick (e.g. "save note" then "complete stage") compose
   * instead of overwriting each other with a stale snapshot.
   */
  const latest = useRef(state.p);
  /** This tab has changes that are not written yet. */
  const dirty = useRef(boot.current.dirty);
  /** When this tab last changed something (decides merges). */
  const changedAt = useRef(boot.current.dirty ? Date.now() : 0);
  /** updatedAt of the stored copy this tab last read or wrote. */
  const knownStamp = useRef<number | null>(boot.current.stamp);
  const lastSaveIssue = useRef<StorageIssue>(null);
  const drafts = useRef(new Set<() => void>());
  const gen = useRef<GenTarget | null>(null);
  /** No AI envelopes until then (server rate limit / busy), and why. */
  const aiBlockedUntil = useRef(state.aiBlockedUntil);
  const aiBlockReason = useRef<BlockReason | null>(state.aiBlockReason);
  /** In-memory "last seen" — the fallback when storage can't keep the seen key. */
  const memSeen = useRef(0);
  /** The page is unloading: in-flight generation errors are not real failures. */
  const unloading = useRef(false);
  const lastTransition = useRef(Number.NEGATIVE_INFINITY);
  /** Envelopes left "writing" by a previous page load wait for the first status check. */
  const pendingWriting = useRef(Boolean(state.p.draw?.envelopes.some((e) => e.status === 'writing')));
  /** Bumped to run the writing check again (see below). */
  const [writingCheck, setWritingCheck] = useState(0);

  const update = useCallback((fn: (p: PersistedState) => PersistedState) => {
    const prev = latest.current;
    const changed = fn(prev);
    if (changed === prev) return;
    const now = Date.now();
    const next = restamp(prev, changed, now);
    latest.current = next;
    dirty.current = true;
    changedAt.current = now;
    dispatch({ type: 'setPersisted', p: next });
  }, []);

  /** Replaces in-memory state with what another tab wrote (not a local change). */
  const adopt = useCallback((next: PersistedState) => {
    latest.current = next;
    dispatch({ type: 'setPersisted', p: next });
  }, []);

  // Toasts dismiss themselves (see <Toasts>): the timer pauses while one is hovered or focused.
  const toast = useCallback((message: string, tone: Toast['tone'] = 'info') => {
    dispatch({ type: 'toast', toast: { id: makeId('toast'), message, tone } });
  }, []);

  // ── persistence ──
  const saveTimer = useRef<number | null>(null);

  const flush = useCallback(() => {
    if (saveTimer.current !== null) {
      window.clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    if (!dirty.current) return;
    const storage = getBrowserStorage();
    let p = latest.current;
    const raw = readRaw(storage);
    const stamp = storedStamp(raw);
    if (raw !== null && stamp !== null && stamp !== knownStamp.current) {
      // Someone else wrote since we last looked: merge instead of overwriting.
      try {
        const theirs = sanitizeState(JSON.parse(raw)).state;
        p = mergeStates(p, theirs, changedAt.current);
        adopt(p);
      } catch {
        // Unreadable copy: ours is the only good one left.
      }
    }
    const now = Date.now();
    const result = saveState(p, storage, now);
    const issue: StorageIssue = result.ok ? null : result.reason === 'quota' ? 'quota' : 'unavailable';
    if (result.ok) {
      knownStamp.current = now;
      dirty.current = false;
    }
    dispatch({ type: 'storage', writable: result.ok, issue });
    if (issue === 'quota' && lastSaveIssue.current !== 'quota') toast('Storage on this device is full — your newest progress may not be saved.', 'warn');
    lastSaveIssue.current = issue;
  }, [adopt, toast]);

  // Debounced save after each local change.
  useEffect(() => {
    if (!dirty.current) return;
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(flush, 150);
  }, [state.p, flush]);

  /** Takes in a state written by another tab (merging if this tab has unsaved changes). */
  const receive = useCallback(
    (raw: string) => {
      const stamp = storedStamp(raw);
      if (stamp === null || stamp === knownStamp.current) return;
      let theirs: PersistedState;
      try {
        theirs = sanitizeState(JSON.parse(raw)).state;
      } catch {
        return;
      }
      const next = dirty.current ? mergeStates(latest.current, theirs, changedAt.current) : theirs;
      knownStamp.current = stamp;
      // A generation for an envelope that is no longer waiting on this tab is wasted work. One that
      // another tab carried into its re-deal (same scene) is still wanted: it goes on, into that draw.
      const g = gen.current;
      if (g) {
        const env = writingFor(next.draw, g);
        if (!env || !next.draw) {
          g.ctl.abort();
          gen.current = null;
          dispatch({ type: 'endGeneration', drawId: g.drawId, slot: g.slot });
        } else if (next.draw.id !== g.drawId || env.slot !== g.slot) {
          g.drawId = next.draw.id;
          g.slot = env.slot;
          writeGenBeat(getBrowserStorage(), { drawId: g.drawId, slot: g.slot, owner: TAB_ID, token: g.token, at: Date.now() });
          dispatch({ type: 'retargetGeneration', drawId: g.drawId, slot: g.slot });
        }
      }
      adopt(next);
      // An AI envelope that another tab is writing: if that tab goes away mid-stream, this one
      // takes over. (The writing check waits for as long as the other tab's beat stays fresh.)
      if (!gen.current && !pendingWriting.current && next.draw?.envelopes.some((e) => e.status === 'writing')) {
        pendingWriting.current = true;
        setWritingCheck((n) => n + 1);
      }
    },
    [adopt],
  );

  /** Marks the running episode as seen now (only the visible play tab does this). */
  const touchSeen = useCallback((runId: string, now: number) => {
    memSeen.current = now;
    writeSeen(getBrowserStorage(), runId, now);
  }, []);

  /**
   * Long-absence check for the running episode (refresh, background tab, sleep).
   * `touch`: this tab is showing the episode, so it also counts as "seen now".
   */
  const checkAbsence = useCallback(
    (touch: boolean) => {
      const run = latest.current.run;
      if (!isRunning(run)) return;
      const storage = getBrowserStorage();
      const now = Date.now();
      const seen = Math.max(run.lastSeenAt, readSeen(storage, run.id) ?? 0, memSeen.current);
      const { run: recovered, autoPaused } = recoverRun({ ...run, lastSeenAt: seen }, now);
      if (autoPaused) {
        update((p) => (p.run && p.run.id === run.id ? { ...p, run: recovered } : p));
        toast(WELCOME_BACK);
      }
      if (touch) touchSeen(run.id, now);
    },
    [update, toast, touchSeen],
  );

  // Stable on purpose: inputs register once per mount, not on every store change.
  const registerDraft = useCallback((commit: () => void) => {
    drafts.current.add(commit);
    return () => {
      drafts.current.delete(commit);
    };
  }, []);

  const commitDrafts = useCallback(() => {
    for (const commit of drafts.current) {
      try {
        commit();
      } catch {
        // A broken draft must not stop the save.
      }
    }
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && typeof e.newValue === 'string') receive(e.newValue);
      if (e.key === AI_BLOCK_KEY) {
        // Another tab was asked to pause AI envelopes: so is this one.
        const block = parseAiBlock(e.newValue, Date.now());
        if (block && block.until > aiBlockedUntil.current) {
          aiBlockedUntil.current = block.until;
          aiBlockReason.current = block.reason;
          dispatch({ type: 'aiBlocked', until: block.until, reason: block.reason });
        }
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        const run = latest.current.run;
        if (isRunning(run) && onPlayRoute()) touchSeen(run.id, Date.now());
        commitDrafts();
        flush();
      } else {
        const raw = readRaw(getBrowserStorage());
        if (raw !== null) receive(raw);
        checkAbsence(onPlayRoute());
      }
    };
    const onPageHide = () => {
      const run = latest.current.run;
      // Only a play screen the user is looking at counts as "seen" at unload time.
      if (isRunning(run) && document.visibilityState === 'visible' && onPlayRoute()) touchSeen(run.id, Date.now());
      unloading.current = true;
      commitDrafts();
      flush();
    };
    const onPageShow = (e: PageTransitionEvent) => {
      unloading.current = false;
      if (!e.persisted) return;
      const raw = readRaw(getBrowserStorage());
      if (raw !== null) receive(raw);
      checkAbsence(onPlayRoute());
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('pageshow', onPageShow);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('pageshow', onPageShow);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [receive, flush, checkAbsence, commitDrafts, touchSeen]);

  // "Last seen" heartbeat while an episode is running and shown in a visible tab.
  // Other tabs (Home, My Series, a second window) never keep it fresh. A long gap
  // between ticks (the device slept) is caught by the same absence check.
  const runningId = isRunning(state.p.run) ? state.p.run.id : null;
  useEffect(() => {
    if (!runningId) return;
    const tick = () => {
      if (document.visibilityState === 'visible' && onPlayRoute()) checkAbsence(true);
    };
    tick();
    const id = window.setInterval(tick, HEARTBEAT_MS);
    window.addEventListener('hashchange', tick);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('hashchange', tick);
    };
  }, [runningId, checkAbsence]);

  // Startup notices go out after mount, so the live region already exists and announces them.
  // (Cleared only when shown, so React StrictMode's remount in development still shows it.)
  useEffect(() => {
    const message = boot.current?.startupToast;
    if (!message) return;
    const id = window.setTimeout(() => {
      if (!boot.current?.startupToast) return;
      boot.current.startupToast = null;
      toast(message);
    }, 400);
    return () => window.clearTimeout(id);
  }, [toast]);

  // When the per-visitor AI pause ends, ask for a fresh status so the pill and copy recover.
  useEffect(() => {
    const wait = state.aiBlockedUntil - Date.now();
    if (wait <= 0) return;
    const id = window.setTimeout(() => refreshDirectorRef.current(false), wait + 500);
    return () => window.clearTimeout(id);
  }, [state.aiBlockedUntil]);

  // ── AI Director status ──
  const refreshDirector = useCallback((force = false) => {
    const ctl = new AbortController();
    const done = fetchDirectorStatus(ctl.signal, force)
      .then((status) => {
        dispatch({ type: 'director', status });
        return status;
      })
      .catch(() => null);
    return { ctl, done };
  }, []);
  const refreshDirectorRef = useRef(refreshDirector);
  refreshDirectorRef.current = refreshDirector;
  useEffect(() => {
    const { ctl } = refreshDirector();
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') refreshDirector();
    }, 60_000);
    const onFocus = () => refreshDirector();
    window.addEventListener('focus', onFocus);
    return () => {
      ctl.abort();
      window.clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, [refreshDirector]);

  // ── motion preference → <html data-motion> ──
  useEffect(() => {
    const root = document.documentElement;
    if (state.p.settings.motion === 'system') root.removeAttribute('data-motion');
    else root.setAttribute('data-motion', state.p.settings.motion);
  }, [state.p.settings.motion]);

  // ── AI generation for one envelope slot ──
  const generate = useCallback(
    (draw: Draw, slot: number) => {
      gen.current?.ctl.abort();
      const ctl = new AbortController();
      const key = draw.envelopes.find((e) => e.slot === slot)?.genKey ?? `${draw.id}:${slot}`;
      const target: GenTarget = { ctl, drawId: draw.id, slot, key, token: makeId('gen') };
      gen.current = target;
      const others = draw.envelopes.filter((e) => e.slot !== slot && e.adventure).map((e) => e.adventure!);
      const recent = latest.current.completed.slice(-5).map((c) => c.title);
      dispatch({ type: 'generation', generation: { drawId: draw.id, slot, phase: 'plotting', progress: 0.02, title: null, startedAt: Date.now(), round: 1 } });
      // The detail travels with the draw, so a retry after a reload still uses it.
      const detail = (draw.detail ?? '').trim().slice(0, MAX_AI_DETAIL);

      // Tell other tabs this envelope is being written here, so they don't start a duplicate.
      const beat = () => writeGenBeat(getBrowserStorage(), { drawId: target.drawId, slot: target.slot, owner: TAB_ID, token: target.token, at: Date.now() });
      beat();
      const beatTimer = window.setInterval(beat, 3_000);

      // A reload while writing aborts the stream: that is not the AI failing, and
      // the envelope stays "writing" so the next load can ask again.
      const onBeforeUnload = () => {
        unloading.current = true;
      };
      window.addEventListener('beforeunload', onBeforeUnload);

      const setEnvelope = (patch: Partial<DrawEnvelope>) =>
        update((p) => {
          if (!p.draw || p.draw.id !== target.drawId) return p;
          const envelopes = p.draw.envelopes.map((e) => (e.slot === target.slot ? { ...e, ...patch } : e));
          return { ...p, draw: markShown({ ...p.draw, envelopes }, patch.source === 'curated' ? patch.adventure : null) };
        });

      requestEpisode(
        {
          prefs: draw.prefs,
          detail: detail || undefined,
          localHour: new Date().getHours(),
          avoidTitles: [...others.map((a) => a.title), ...recent],
          avoidKinds: others.map((a) => a.kind),
        },
        { signal: ctl.signal, onEvent: (event) => dispatch({ type: 'generationEvent', drawId: target.drawId, event }) },
      )
        .then((adventure) => {
          if (ctl.signal.aborted) return;
          setEnvelope({ status: 'ready', source: 'ai', adventure, opened: false, note: 'Written for you by the AI Director' });
          refreshDirector(false);
        })
        .catch((err: unknown) => {
          if ((err as Error).name === 'AbortError' || ctl.signal.aborted || unloading.current) return;
          const reason = err instanceof DirectorError ? err.message : 'The AI Director could not finish.';
          // Our own server turned this browser away (its rate limit, a full server, stream caps):
          // every tab of it would be too, until then. A provider limit hit while writing is not
          // about this visitor: the server's status holds it for a moment instead.
          if (err instanceof DirectorError && !err.inStream && (err.code === 'rate_limited' || err.code === 'busy' || err.code === 'too_many_streams')) {
            const why: BlockReason = err.code === 'rate_limited' ? 'rate_limited' : err.code === 'busy' ? 'busy' : err.networkWide ? 'network' : 'connection';
            const until = Date.now() + (err.retryAfterMs ?? (err.code === 'rate_limited' ? 60_000 : 20_000));
            // A longer pause already in force keeps its own end and its own reason.
            if (until >= aiBlockedUntil.current) {
              aiBlockedUntil.current = until;
              aiBlockReason.current = why;
            }
            const reasonNow = aiBlockReason.current ?? why;
            writeAiBlock(getBrowserStorage(), { until: aiBlockedUntil.current, reason: reasonNow });
            dispatch({ type: 'aiBlocked', until: aiBlockedUntil.current, reason: reasonNow });
          }
          const current = latest.current.draw;
          const fb = current && current.id === target.drawId ? fallbackFor(current, latest.current.completed) : null;
          setEnvelope(
            fb
              ? { status: 'ready', source: 'curated', adventure: fb, opened: false, note: `${reason} Here is an archive pick instead.` }
              : { status: 'failed', adventure: null, note: reason },
          );
          // Let the server's own TTL decide; a forced provider check says nothing about writing.
          refreshDirector(false);
        })
        .finally(() => {
          window.removeEventListener('beforeunload', onBeforeUnload);
          window.clearInterval(beatTimer);
          // The outcome is saved before the beat goes: a tab that finds no beat must also find the
          // envelope written (or the draw gone), or it would pay to write it again.
          flush();
          clearGenBeat(getBrowserStorage(), target.token);
          if (gen.current === target) gen.current = null;
          dispatch({ type: 'endGeneration', drawId: target.drawId, slot: target.slot });
        });
    },
    [update, refreshDirector, flush],
  );

  useEffect(() => () => gen.current?.ctl.abort(), []);

  // Envelopes left "writing" by a previous page load, or by another tab: ask again once we know
  // the Director can write — unless another open tab is still writing (then wait for its result,
  // and take over if its beat goes quiet).
  useEffect(() => {
    if (!pendingWriting.current || state.director.state === 'checking') return;
    const draw = latest.current.draw;
    const env = draw?.envelopes.find((e) => e.status === 'writing');
    if (!draw || !env || gen.current) {
      pendingWriting.current = false;
      return;
    }
    const storage = getBrowserStorage();
    if (ownedElsewhere(readGenBeat(storage), TAB_ID, Date.now())) {
      // Each tab looks again at its own moment, so two open tabs don't decide in step.
      const id = window.setTimeout(() => setWritingCheck((n) => n + 1), 4_000 + Math.random() * 2_000);
      return () => window.clearTimeout(id);
    }
    if (!state.director.canGenerate) {
      pendingWriting.current = false;
      update((p) => settleWriting(p, state.director.state === 'rate_limited' ? 'The AI Director is busy right now.' : 'The AI Director is offline right now.'));
      return;
    }
    // Claim it first. Two open tabs that find it orphaned at once both claim; the claim written
    // last is the one both read back, so exactly one of them writes the envelope.
    const claim = makeId('claim');
    writeGenBeat(storage, { drawId: draw.id, slot: env.slot, owner: TAB_ID, token: claim, at: Date.now() });
    const id = window.setTimeout(() => {
      const beat = readGenBeat(getBrowserStorage());
      const current = latest.current.draw;
      const still = current?.envelopes.find((e) => e.slot === env.slot && e.status === 'writing');
      if (beat?.token === claim && current && still && !gen.current) {
        pendingWriting.current = false;
        generate(current, still.slot);
        return;
      }
      clearGenBeat(getBrowserStorage(), claim);
      setWritingCheck((n) => n + 1);
    }, CLAIM_SETTLE_MS + Math.random() * 400);
    return () => {
      window.clearTimeout(id);
      clearGenBeat(getBrowserStorage(), claim);
    };
  }, [state.director, generate, update, writingCheck]);

  // ── draws ──
  const makeDraw = useCallback(
    (prefs: Prefs, previous: Draw | null) => {
      const s = stateRef.current;
      const aiOn = s.director.canGenerate && Date.now() >= aiBlockedUntil.current;
      const detail = s.detail.trim().slice(0, MAX_AI_DETAIL);
      const current = latest.current.draw;
      // A personalized envelope survives a re-deal with the same prefs and detail: one still
      // being written, in this tab or in another open one (no second paid request), or one
      // written but not opened yet.
      const g = gen.current;
      const sameAsk = Boolean(current && samePrefs(current.prefs, prefs) && (current.detail ?? '') === detail);
      const writing = current?.envelopes.find((e) => e.source === 'ai' && e.status === 'writing') ?? null;
      const writingHere = Boolean(g && current && writing && writingFor(current, g) === writing);
      const writingElsewhere = Boolean(!g && writing && ownedElsewhere(readGenBeat(getBrowserStorage()), TAB_ID, Date.now()));
      const carry = !sameAsk
        ? null
        : writing && (writingHere || writingElsewhere)
          ? writing
          : g && current && g.drawId === current.id
            ? null
            : (current?.envelopes.find((e) => e.source === 'ai' && e.status === 'ready' && e.adventure && !e.opened) ?? null);
      const withAi = aiOn || carry !== null;
      const count = withAi ? 2 : 3;
      const seed = previous ? previous.seed + 1 : hashSeed('draw', Date.now(), latest.current.completed.length);
      const { match, picks, shownIds } = dealCurated(LIBRARY, prefs, { history: historyOf(latest.current.completed), previous, count, seed });
      const envelopes: DrawEnvelope[] = picks.map((pick, i) => ({ slot: i, status: 'ready', source: 'curated', adventure: pick.adventure, opened: false }));
      const aiSlot = envelopes.length;
      if (carry) envelopes.push({ ...carry, slot: aiSlot });
      else if (aiOn) envelopes.push({ slot: aiSlot, status: 'writing', source: 'ai', adventure: null, opened: false, note: 'Written for you', genKey: makeId('gen') });
      const draw: Draw = { id: makeId('draw'), createdAt: Date.now(), prefs, seed, envelopes, shownIds };
      if (detail && (aiOn || carry)) draw.detail = detail;
      dispatch({ type: 'match', match });
      const keepWriting = Boolean(carry && writingHere && g);
      if (g && !keepWriting) {
        g.ctl.abort();
        gen.current = null;
        dispatch({ type: 'generation', generation: null });
      }
      update((p) => ({ ...p, prefs, draw }));
      // The beat naming the new draw goes out first, then the draw itself — saved now, not after
      // the usual short delay. Other tabs drop work for the old draw (or carry on with an envelope
      // it kept) at once, and never find a "writing" envelope without a live beat beside it.
      if (keepWriting && g) {
        g.drawId = draw.id;
        g.slot = aiSlot;
        writeGenBeat(getBrowserStorage(), { drawId: draw.id, slot: aiSlot, owner: TAB_ID, token: g.token, at: Date.now() });
        dispatch({ type: 'retargetGeneration', drawId: draw.id, slot: aiSlot });
      }
      if (aiOn && !carry) generate(draw, aiSlot);
      flush();
      return draw;
    },
    [generate, update, flush],
  );

  const api = useMemo<StoreApi>(() => {
    const withRun = (fn: (run: Run, now: number) => Run) =>
      update((p) => (p.run ? { ...p, run: fn(p.run, Date.now()) } : p));

    const finishIfDone = (run: Run): CompletedEpisode | null => {
      if (!isFinished(run)) return null;
      const episode = completeEpisode(run, Date.now());
      update((p) => ({ ...p, run: null, completed: [...p.completed.filter((c) => c.id !== episode.id), episode] }));
      return episode;
    };

    /**
     * Double-tap guard: the second tap of a double tap (on Done, an option or Resume)
     * must not land on whatever appears under the finger next.
     */
    const transitionAllowed = () => {
      const now = monotonic();
      if (now - lastTransition.current < TRANSITION_GUARD_MS) return false;
      lastTransition.current = now;
      return true;
    };

    return {
      state,
      setPrefs: (prefs) => update((p) => ({ ...p, prefs })),
      setDetail: (detail) => dispatch({ type: 'detail', detail: detail.slice(0, MAX_AI_DETAIL) }),
      drawEnvelopes: (prefs) => {
        makeDraw(prefs ?? latest.current.prefs, null);
      },
      reshuffle: () => {
        const p = latest.current;
        makeDraw(p.draw?.prefs ?? p.prefs, p.draw);
      },
      openEnvelope: (slot) =>
        update((p) => (p.draw ? { ...p, draw: { ...p.draw, envelopes: p.draw.envelopes.map((e) => (e.slot === slot ? { ...e, opened: true } : e)) } } : p)),
      retryAiEnvelope: (slot) => {
        const draw = latest.current.draw;
        if (!draw || !stateRef.current.director.canGenerate) return;
        const next: Draw = {
          ...draw,
          envelopes: draw.envelopes.map((e) =>
            e.slot === slot ? { ...e, status: 'writing', source: 'ai', adventure: null, opened: false, note: 'Written for you', genKey: makeId('gen') } : e,
          ),
        };
        update((p) => ({ ...p, draw: next }));
        generate(next, slot);
      },
      startEpisode: (slot) => {
        const p = latest.current;
        const env = p.draw?.envelopes.find((e) => e.slot === slot);
        const adventure = env ? envelopeAdventure(env) : null;
        if (!adventure || !p.draw) return null;
        gen.current?.ctl.abort();
        gen.current = null;
        dispatch({ type: 'generation', generation: null });
        const run = startRun(adventure, p.draw.prefs, nextEpisodeNumber(p.completed), Date.now(), makeId('run'));
        lastTransition.current = monotonic();
        update((p) => ({ ...p, run, draw: null }));
        return run;
      },
      abandonRun: () => update((p) => ({ ...p, run: null })),
      pause: () => withRun((run, now) => pauseRun(run, now)),
      resume: () => {
        lastTransition.current = monotonic();
        withRun((run, now) => resumeRun(run, now));
        dispatch({ type: 'dismissToasts', messages: PAUSE_NOTICES });
      },
      toggleAlternative: () => withRun((run) => engineToggleAlt(run)),
      setNote: (key, value) => withRun((run) => engineSetNote(run, key, value)),
      completeStage: () => {
        const run = latest.current.run;
        if (!run || isFinished(run) || run.phase !== 'action' || !transitionAllowed()) return null;
        const next = engineComplete(run, Date.now());
        if (isFinished(next)) return finishIfDone(next);
        update((p) => ({ ...p, run: next }));
        return null;
      },
      choose: (optionId) => {
        const run = latest.current.run;
        if (!run || isFinished(run) || run.phase !== 'choice' || !transitionAllowed()) return null;
        const next = engineChoose(run, optionId, Date.now());
        if (isFinished(next)) return finishIfDone(next);
        update((p) => ({ ...p, run: next }));
        return null;
      },
      saveAndExit: () => {
        withRun((run, now) => pauseRun(run, now));
        toast(SAVED_PAUSED, 'success');
      },
      setJournal: (episodeId, journal) =>
        update((p) => {
          const value = journal.slice(0, 200);
          const target = p.completed.find((c) => c.id === episodeId);
          if (!target || target.journal === value) return p;
          const editedAt = Date.now();
          return { ...p, completed: p.completed.map((c) => (c.id === episodeId ? { ...c, journal: value, editedAt } : c)) };
        }),
      setSeriesName: (name) => update((p) => ({ ...p, series: { name: name && name.trim() ? name.trim().slice(0, 48) : null, namePromptDone: true } })),
      dismissNamePrompt: () => update((p) => ({ ...p, series: { ...p.series, namePromptDone: true } })),
      setMotion: (motion) => update((p) => ({ ...p, settings: { ...p.settings, motion } })),
      resetAll: () => {
        gen.current?.ctl.abort();
        gen.current = null;
        dispatch({ type: 'generation', generation: null });
        update((p) => ({ ...p, draw: null, run: null, completed: [], series: { name: null, namePromptDone: false }, resetAt: Date.now() }));
        dispatch({ type: 'match', match: null });
      },
      // Settles even when the server answers from its short refresh throttle with the same snapshot.
      refreshDirector: () =>
        refreshDirector(true).done.then((status) => (status ? withClientLimit(status, aiBlockedUntil.current, aiBlockReason.current, Date.now()) : null)),
      toast,
      dismissToast: (id) => dispatch({ type: 'dismissToast', id }),
      registerDraft,
    };
  }, [state, update, makeDraw, generate, refreshDirector, toast, registerDraft]);

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}

/** Resolves an envelope's adventure, re-hydrating curated ones from the library when possible. */
export function envelopeAdventure(env: DrawEnvelope): Adventure | null {
  if (!env.adventure) return null;
  if (env.source === 'curated') return getCuratedAdventure(env.adventure.id) ?? env.adventure;
  return env.adventure;
}
