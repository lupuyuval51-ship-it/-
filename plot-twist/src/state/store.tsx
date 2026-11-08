/**
 * App store: persisted state (localStorage) + ephemeral UI state, with the
 * actions that orchestrate matching, runs, AI generation and progression.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react';
import { DirectorError, fetchDirectorStatus, requestEpisode, type DirectorEvent, type DirectorStatus } from '../ai/client.ts';
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
  touchRun,
} from '../engine/run.ts';
import type { CompletedEpisode, MatchResult, Run } from '../engine/types.ts';
import type { Adventure, Prefs } from '../../shared/types.ts';
import { getBrowserStorage, loadState, saveState } from './persistence.ts';
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

interface State {
  p: PersistedState;
  loadStatus: LoadStatus;
  loadMessage?: string;
  storageWritable: boolean;
  director: DirectorStatus;
  generation: Generation | null;
  toasts: Toast[];
  /** The latest match result for the current draw (conflict + relaxations). */
  match: MatchResult | null;
  /** Optional free-text detail for the AI Director (not persisted). */
  detail: string;
}

type Action =
  | { type: 'setPersisted'; p: PersistedState }
  | { type: 'director'; status: DirectorStatus }
  | { type: 'generation'; generation: Generation | null }
  | { type: 'generationEvent'; drawId: string; event: DirectorEvent }
  | { type: 'match'; match: MatchResult | null }
  | { type: 'toast'; toast: Toast }
  | { type: 'dismissToast'; id: string }
  | { type: 'storage'; writable: boolean }
  | { type: 'detail'; detail: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'setPersisted':
      return state.p === action.p ? state : { ...state, p: action.p };
    case 'director':
      return { ...state, director: action.status };
    case 'generation':
      return { ...state, generation: action.generation };
    case 'generationEvent': {
      const g = state.generation;
      if (!g || g.drawId !== action.drawId) return state;
      const e = action.event;
      if (e.type === 'phase') return { ...state, generation: { ...g, phase: e.phase, progress: e.phase === 'repairing' ? 0.15 : e.phase === 'checking' ? Math.max(g.progress, 0.96) : g.progress } };
      if (e.type === 'progress') return { ...state, generation: { ...g, progress: Math.max(g.progress, Math.min(0.95, e.chars / Math.max(1, e.expected))) } };
      if (e.type === 'title') return { ...state, generation: { ...g, title: e.title } };
      return state;
    }
    case 'match':
      return { ...state, match: action.match };
    case 'toast':
      return { ...state, toasts: [...state.toasts.filter((t) => t.message !== action.toast.message), action.toast].slice(-3) };
    case 'dismissToast':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) };
    case 'storage':
      return state.storageWritable === action.writable ? state : { ...state, storageWritable: action.writable };
    case 'detail':
      return { ...state, detail: action.detail };
  }
}

// ── helpers ──────────────────────────────────────────────────────────

const MAX_AI_DETAIL = 140;

function historyOf(completed: readonly CompletedEpisode[]) {
  return completed.map((c) => ({ adventureId: c.adventureId, completedAt: c.completedAt }));
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

/** On load, an envelope that was mid-generation can't resume — swap it for a curated pick. */
function settleInterruptedDraw(p: PersistedState): PersistedState {
  const draw = p.draw;
  if (!draw || !draw.envelopes.some((e) => e.status === 'writing' || (e.status === 'failed' && !e.adventure))) return p;
  const envelopes: DrawEnvelope[] = [];
  let working: Draw = { ...draw, envelopes: [...draw.envelopes] };
  for (const env of draw.envelopes) {
    if (env.status === 'ready' && env.adventure) {
      envelopes.push(env);
      continue;
    }
    const fb = fallbackFor(working, p.completed);
    const next: DrawEnvelope = fb
      ? { ...env, status: 'ready', source: 'curated', adventure: fb, opened: false, note: 'The AI Director was interrupted — here is an archive pick instead.' }
      : { ...env, status: 'failed', adventure: null, note: 'The AI Director was interrupted.' };
    envelopes.push(next);
    working = { ...working, envelopes: working.envelopes.map((e) => (e.slot === env.slot ? next : e)) };
  }
  return { ...p, draw: { ...draw, envelopes } };
}

function initState(): State {
  const storage = getBrowserStorage();
  const loaded = loadState(storage);
  let p = settleInterruptedDraw(loaded.state);
  let toast: Toast | null = null;
  if (p.run && !isFinished(p.run)) {
    const { run, autoPaused } = recoverRun(p.run, Date.now());
    p = { ...p, run };
    if (autoPaused) toast = { id: makeId('toast'), message: 'Welcome back — we paused the clock while you were away.', tone: 'info' };
  }
  return {
    p,
    loadStatus: loaded.status,
    loadMessage: loaded.message,
    storageWritable: storage !== null && loaded.status !== 'unavailable',
    director: CHECKING_STATUS,
    generation: null,
    toasts: toast ? [toast] : [],
    match: null,
    detail: '',
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
  refreshDirector: () => void;
  toast: (message: string, tone?: Toast['tone']) => void;
  dismissToast: (id: string) => void;
}

const StoreContext = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initState);
  const stateRef = useRef(state);
  stateRef.current = state;
  const aiAbort = useRef<AbortController | null>(null);

  /**
   * The freshest persisted state. Updates apply here synchronously, so actions
   * fired in the same tick (e.g. "save note" then "complete stage") compose
   * instead of overwriting each other with a stale snapshot.
   */
  const latest = useRef(state.p);
  const update = useCallback((fn: (p: PersistedState) => PersistedState) => {
    const next = fn(latest.current);
    if (next === latest.current) return;
    latest.current = next;
    dispatch({ type: 'setPersisted', p: next });
  }, []);
  const toast = useCallback((message: string, tone: Toast['tone'] = 'info') => {
    const id = makeId('toast');
    dispatch({ type: 'toast', toast: { id, message, tone } });
    window.setTimeout(() => dispatch({ type: 'dismissToast', id }), 4200);
  }, []);

  // ── persistence (debounced, flushed when the page hides) ──
  const saveTimer = useRef<number | null>(null);
  const flush = useCallback(() => {
    if (saveTimer.current !== null) {
      window.clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    const p = latest.current;
    const persisted = p.run && !isFinished(p.run) ? { ...p, run: touchRun(p.run, Date.now()) } : p;
    const result = saveState(persisted, getBrowserStorage());
    dispatch({ type: 'storage', writable: result.ok });
    if (!result.ok && result.reason === 'quota') toast('Storage is full — your newest progress may not be saved.', 'warn');
  }, [toast]);

  useEffect(() => {
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(flush, 150);
  }, [state.p, flush]);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [flush]);

  // Keep lastSeenAt fresh while an episode is running (used for long-absence recovery).
  const hasActiveRun = Boolean(state.p.run && !isFinished(state.p.run));
  useEffect(() => {
    if (!hasActiveRun) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') flush();
    }, 15_000);
    return () => window.clearInterval(id);
  }, [hasActiveRun, flush]);

  // ── AI Director status ──
  const refreshDirector = useCallback((force = false) => {
    const ctl = new AbortController();
    fetchDirectorStatus(ctl.signal, force)
      .then((status) => dispatch({ type: 'director', status }))
      .catch(() => {});
    return ctl;
  }, []);
  useEffect(() => {
    const ctl = refreshDirector();
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
      aiAbort.current?.abort();
      const ctl = new AbortController();
      aiAbort.current = ctl;
      const others = draw.envelopes.filter((e) => e.slot !== slot && e.adventure).map((e) => e.adventure!);
      const recent = latest.current.completed.slice(-5).map((c) => c.title);
      dispatch({ type: 'generation', generation: { drawId: draw.id, slot, phase: 'plotting', progress: 0.02, title: null, startedAt: Date.now() } });
      const detail = stateRef.current.detail.trim().slice(0, MAX_AI_DETAIL);

      const setEnvelope = (patch: Partial<DrawEnvelope>) =>
        update((p) => {
          if (!p.draw || p.draw.id !== draw.id) return p;
          return { ...p, draw: { ...p.draw, envelopes: p.draw.envelopes.map((e) => (e.slot === slot ? { ...e, ...patch } : e)) } };
        });

      requestEpisode(
        {
          prefs: draw.prefs,
          detail: detail || undefined,
          localHour: new Date().getHours(),
          avoidTitles: [...others.map((a) => a.title), ...recent],
          avoidKinds: others.map((a) => a.kind),
        },
        { signal: ctl.signal, onEvent: (event) => dispatch({ type: 'generationEvent', drawId: draw.id, event }) },
      )
        .then((adventure) => {
          setEnvelope({ status: 'ready', source: 'ai', adventure, opened: false, note: 'Written for you by the AI Director' });
          dispatch({ type: 'director', status: { ...stateRef.current.director, state: 'online', label: 'Online', canGenerate: true } });
        })
        .catch((err: unknown) => {
          if ((err as Error).name === 'AbortError') return;
          const reason = err instanceof DirectorError ? err.message : 'The AI Director could not finish.';
          const current = latest.current.draw;
          const fb = current && current.id === draw.id ? fallbackFor(current, latest.current.completed) : null;
          setEnvelope(
            fb
              ? { status: 'ready', source: 'curated', adventure: fb, opened: false, note: `${reason} Here is an archive pick instead.` }
              : { status: 'failed', adventure: null, note: reason },
          );
          refreshDirector(true);
        })
        .finally(() => {
          if (aiAbort.current === ctl) aiAbort.current = null;
          const g = stateRef.current.generation;
          if (g && g.drawId === draw.id && g.slot === slot) dispatch({ type: 'generation', generation: null });
        });
    },
    [update, refreshDirector],
  );

  useEffect(() => () => aiAbort.current?.abort(), []);

  // ── draws ──
  const makeDraw = useCallback(
    (prefs: Prefs, previous: Draw | null) => {
      const s = stateRef.current;
      const aiOn = s.director.canGenerate;
      const seed = previous ? previous.seed + 1 : hashSeed('draw', Date.now(), latest.current.completed.length);
      const count = aiOn ? 2 : 3;
      const history = historyOf(latest.current.completed);
      const exclude = previous ? previous.shownIds : [];
      let match = matchAdventures(LIBRARY, prefs, { history, exclude, count, seed });
      if (match.picks.length < count && exclude.length) match = matchAdventures(LIBRARY, prefs, { history, count, seed });
      const envelopes: DrawEnvelope[] = match.picks.map((pick, i) => ({ slot: i, status: 'ready', source: 'curated', adventure: pick.adventure, opened: false }));
      if (aiOn) envelopes.push({ slot: envelopes.length, status: 'writing', source: 'ai', adventure: null, opened: false, note: 'Written for you' });
      const draw: Draw = {
        id: makeId('draw'),
        createdAt: Date.now(),
        prefs,
        seed,
        envelopes,
        shownIds: Array.from(new Set([...(previous?.shownIds ?? []), ...match.picks.map((p) => p.adventure.id)])),
      };
      dispatch({ type: 'match', match });
      update((p) => ({ ...p, prefs, draw }));
      if (aiOn) generate(draw, envelopes.length - 1);
      return draw;
    },
    [generate, update],
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
        const next: Draw = { ...draw, envelopes: draw.envelopes.map((e) => (e.slot === slot ? { ...e, status: 'writing', source: 'ai', adventure: null, opened: false, note: 'Written for you' } : e)) };
        update((p) => ({ ...p, draw: next }));
        generate(next, slot);
      },
      startEpisode: (slot) => {
        const p = latest.current;
        const env = p.draw?.envelopes.find((e) => e.slot === slot);
        const adventure = env ? envelopeAdventure(env) : null;
        if (!adventure || !p.draw) return null;
        aiAbort.current?.abort();
        dispatch({ type: 'generation', generation: null });
        const episodeNumber = p.completed.length + 1;
        const run = startRun(adventure, p.draw.prefs, episodeNumber, Date.now(), makeId('run'));
        update((p) => ({ ...p, run, draw: null }));
        return run;
      },
      abandonRun: () => update((p) => ({ ...p, run: null })),
      pause: () => withRun((run, now) => pauseRun(run, now)),
      resume: () => withRun((run, now) => resumeRun(run, now)),
      toggleAlternative: () => withRun((run) => engineToggleAlt(run)),
      setNote: (key, value) => withRun((run) => engineSetNote(run, key, value)),
      completeStage: () => {
        const run = latest.current.run;
        if (!run) return null;
        const next = engineComplete(run, Date.now());
        if (isFinished(next)) return finishIfDone(next);
        update((p) => ({ ...p, run: next }));
        return null;
      },
      choose: (optionId) => {
        const run = latest.current.run;
        if (!run) return null;
        const next = engineChoose(run, optionId, Date.now());
        if (isFinished(next)) return finishIfDone(next);
        update((p) => ({ ...p, run: next }));
        return null;
      },
      saveAndExit: () => {
        withRun((run, now) => pauseRun(run, now));
        toast('Saved. Your episode is paused right where you left it.', 'success');
      },
      setJournal: (episodeId, journal) =>
        update((p) => ({ ...p, completed: p.completed.map((c) => (c.id === episodeId ? { ...c, journal: journal.slice(0, 200) } : c)) })),
      setSeriesName: (name) => update((p) => ({ ...p, series: { name: name && name.trim() ? name.trim().slice(0, 48) : null, namePromptDone: true } })),
      dismissNamePrompt: () => update((p) => ({ ...p, series: { ...p.series, namePromptDone: true } })),
      setMotion: (motion) => update((p) => ({ ...p, settings: { ...p.settings, motion } })),
      resetAll: () => {
        aiAbort.current?.abort();
        update((p) => ({ ...p, draw: null, run: null, completed: [], series: { name: null, namePromptDone: false } }));
        dispatch({ type: 'match', match: null });
      },
      refreshDirector: () => refreshDirector(true),
      toast,
      dismissToast: (id) => dispatch({ type: 'dismissToast', id }),
    };
  }, [state, update, makeDraw, generate, refreshDirector, toast]);

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
