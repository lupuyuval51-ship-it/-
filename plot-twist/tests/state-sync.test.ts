import { describe, expect, it } from 'vitest';
import type { Prefs } from '../shared/types.ts';
import { fitsPrefs } from '../shared/validate.ts';
import exemplar from '../src/content/adventures/undercover-tourist.ts';
import { LIBRARY } from '../src/content/library.ts';
import { chooseOption, completeEpisode, completeStage, setNote, startRun } from '../src/engine/run.ts';
import type { CompletedEpisode, Run } from '../src/engine/types.ts';
import { dealCurated } from '../src/state/deal.ts';
import { defaultState } from '../src/state/persistence.ts';
import { GEN_BEAT_STALE_MS, mergeCompleted, mergeStates, ownedElsewhere, readSeen, restamp, SEEN_KEY, storedStamp, writeSeen } from '../src/state/sync.ts';
import type { Draw, PersistedState, StorageLike } from '../src/state/types.ts';

const MIN = 60_000;
const T0 = Date.UTC(2026, 10, 8, 9);
const PREFS: Prefs = { minutes: 30, budget: 0, setting: 'outside', company: 'solo', mood: 'curious', weirdness: 2 };

class MemoryStorage implements StorageLike {
  readonly data = new Map<string, string>();
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
}

function episode(id: string, number: number, at: number, journal = ''): CompletedEpisode {
  let run: Run = setNote(startRun(exemplar, PREFS, number, at - 30 * MIN, id), 'detail', 'a blue door');
  run = completeStage(run, at - 20 * MIN);
  run = chooseOption(run, 'observe', at - 19 * MIN);
  run = completeStage(run, at - 10 * MIN);
  run = completeStage(run, at);
  return completeEpisode(run, at, journal);
}

function state(patch: Partial<PersistedState>): PersistedState {
  return { ...defaultState(T0), ...patch };
}

describe('mergeCompleted', () => {
  it('is a union by id, sorted by completion time', () => {
    const a = episode('run-a', 1, T0 + 1 * MIN);
    const b = episode('run-b', 2, T0 + 2 * MIN);
    const c = episode('run-c', 3, T0 + 3 * MIN);
    const merged = mergeCompleted([a, c], [a, b], true);
    expect(merged.map((e) => e.id)).toEqual(['run-a', 'run-b', 'run-c']);
    expect(merged.map((e) => e.episodeNumber)).toEqual([1, 2, 3]);
  });

  it('picks the preferred copy for an id present on both sides', () => {
    const ours = episode('run-a', 1, T0, 'ours');
    const theirs = { ...ours, journal: 'theirs' };
    expect(mergeCompleted([ours], [theirs], true)[0].journal).toBe('ours');
    expect(mergeCompleted([ours], [theirs], false)[0].journal).toBe('theirs');
  });

  it('renumbers only when two tabs finished an episode with the same number', () => {
    const a = episode('run-a', 1, T0 + 1 * MIN);
    const b = episode('run-b', 2, T0 + 2 * MIN);
    const c = episode('run-c', 2, T0 + 3 * MIN);
    expect(mergeCompleted([a, b], [a, c], true).map((e) => [e.id, e.episodeNumber])).toEqual([
      ['run-a', 1],
      ['run-b', 2],
      ['run-c', 3],
    ]);
    // No collision → numbers untouched, even with a gap.
    const d = episode('run-d', 5, T0 + 4 * MIN);
    expect(mergeCompleted([a], [d], true).map((e) => e.episodeNumber)).toEqual([1, 5]);
  });
});

describe('mergeStates', () => {
  it('never loses an episode another tab finished, even when this tab changed something later', () => {
    const finished = episode('run-a', 1, T0 + 10 * MIN, 'Best Tuesday ever.');
    const theirs = state({ completed: [finished], updatedAt: T0 + 10 * MIN });
    // A stale tab that never saw the episode taps a chip a minute later.
    const ours = state({ prefs: { ...PREFS, minutes: 60 }, updatedAt: T0 });
    const merged = mergeStates(ours, theirs, T0 + 11 * MIN);
    expect(merged.completed.map((e) => e.id)).toEqual(['run-a']);
    expect(merged.completed[0].journal).toBe('Best Tuesday ever.');
    expect(merged.prefs.minutes).toBe(60);
  });

  it('takes non-episode sections from whichever side changed last', () => {
    const theirs = state({ series: { name: 'Season of Doors', namePromptDone: true }, updatedAt: T0 + 5 * MIN });
    const ours = state({ series: { name: null, namePromptDone: false }, updatedAt: T0 });
    expect(mergeStates(ours, theirs, T0 + 1 * MIN).series.name).toBe('Season of Doors');
    expect(mergeStates(ours, theirs, T0 + 9 * MIN).series.name).toBeNull();
  });

  it('drops a run that the other tab already finished', () => {
    const run = startRun(exemplar, PREFS, 1, T0, 'run-a');
    const finished = episode('run-a', 1, T0 + 10 * MIN);
    const theirs = state({ completed: [finished], run: null, updatedAt: T0 + 10 * MIN });
    const ours = state({ run, updatedAt: T0 });
    const merged = mergeStates(ours, theirs, T0 + 11 * MIN);
    expect(merged.run).toBeNull();
    expect(merged.completed).toHaveLength(1);
  });
});

describe('mergeStates with section stamps', () => {
  it('keeps the newest edit of each section, even when the two tabs touched different sections', () => {
    // Tab A changed Motion at t+1s; tab B changed the time chip at t+1.1s (and wrote first).
    const theirs = state({ prefs: { ...PREFS, minutes: 120 }, stamps: { prefs: T0 + 1_100 }, updatedAt: T0 + 1_250 });
    const ours = state({ settings: { motion: 'reduce' }, stamps: { settings: T0 + 1_000 }, updatedAt: T0 });
    const merged = mergeStates(ours, theirs);
    expect(merged.prefs.minutes).toBe(120);
    expect(merged.settings.motion).toBe('reduce');
    expect(merged.stamps).toEqual({ prefs: T0 + 1_100, settings: T0 + 1_000 });
  });

  it('never moves the same run backwards (the copy that got further wins)', () => {
    const start = startRun(exemplar, PREFS, 1, T0, 'run-a');
    const further = completeStage(start, T0 + 5 * MIN);
    const theirs = state({ run: further, stamps: { run: T0 + 5 * MIN }, updatedAt: T0 + 5 * MIN });
    // This tab touched the run later (e.g. toggled the alternative) but on the older copy.
    const ours = state({ run: { ...start, usingAlternative: true }, stamps: { run: T0 + 6 * MIN }, updatedAt: T0 });
    expect(mergeStates(ours, theirs).run?.steps).toHaveLength(1);
  });

  it('never turns a written envelope back into "writing" for the same draw', () => {
    const base = {
      id: 'draw-1',
      createdAt: T0,
      prefs: PREFS,
      seed: 1,
      shownIds: [],
    };
    const writing: Draw = { ...base, envelopes: [{ slot: 0, status: 'writing', source: 'ai', adventure: null, opened: false }] };
    const written: Draw = { ...base, envelopes: [{ slot: 0, status: 'ready', source: 'ai', adventure: exemplar, opened: false }] };
    const ours = state({ draw: writing, stamps: { draw: T0 + 2_000 }, updatedAt: T0 });
    const theirs = state({ draw: written, stamps: { draw: T0 + 1_000 }, updatedAt: T0 + 1_000 });
    expect(mergeStates(ours, theirs).draw?.envelopes[0].status).toBe('ready');
  });

  it('a reset in one tab is not undone by a stale tab’s edit', () => {
    const old = episode('run-a', 1, T0 + 1 * MIN);
    const stale = state({ completed: [old], prefs: { ...PREFS, minutes: 60 }, stamps: { prefs: T0 + 10 * MIN, completed: T0 + 1 * MIN }, updatedAt: T0 + 1 * MIN });
    const reset = state({ completed: [], resetAt: T0 + 9 * MIN, stamps: { completed: T0 + 9 * MIN }, updatedAt: T0 + 9 * MIN });
    const merged = mergeStates(stale, reset);
    expect(merged.completed).toEqual([]);
    expect(merged.resetAt).toBe(T0 + 9 * MIN);
    expect(merged.prefs.minutes).toBe(60);
    // Episodes finished after the reset are kept.
    const fresh = episode('run-b', 1, T0 + 12 * MIN);
    expect(mergeStates(state({ completed: [fresh] }), reset).completed.map((c) => c.id)).toEqual(['run-b']);
  });

  it('restamp marks exactly the sections whose objects changed', () => {
    const prev = state({ stamps: { run: 5 } });
    const next = restamp(prev, { ...prev, prefs: { ...prev.prefs, minutes: 15 } }, 99);
    expect(next.stamps).toEqual({ run: 5, prefs: 99 });
    expect(restamp(prev, prev, 99)).toBe(prev);
  });
});

describe('AI envelope ownership beat', () => {
  it('tells a new tab to wait while another tab is still writing the same envelope', () => {
    const beat = { drawId: 'd1', slot: 2, owner: 'tab-a', at: T0 };
    expect(ownedElsewhere(beat, 'd1', 2, 'tab-b', T0 + 2_000)).toBe(true);
    expect(ownedElsewhere(beat, 'd1', 2, 'tab-a', T0 + 2_000)).toBe(false);
    expect(ownedElsewhere(beat, 'd2', 2, 'tab-b', T0 + 2_000)).toBe(false);
    expect(ownedElsewhere(beat, 'd1', 2, 'tab-b', T0 + GEN_BEAT_STALE_MS + 1)).toBe(false);
    expect(ownedElsewhere(null, 'd1', 2, 'tab-b', T0)).toBe(false);
  });
});

describe('stamps and last seen', () => {
  it('reads the stored updatedAt defensively', () => {
    expect(storedStamp(null)).toBeNull();
    expect(storedStamp('not json')).toBeNull();
    expect(storedStamp(JSON.stringify({ updatedAt: 'x' }))).toBeNull();
    expect(storedStamp(JSON.stringify({ updatedAt: 42 }))).toBe(42);
  });

  it('keeps last-seen per run under its own key', () => {
    const storage = new MemoryStorage();
    writeSeen(storage, 'run-a', 1234);
    expect(storage.data.has(SEEN_KEY)).toBe(true);
    expect(readSeen(storage, 'run-a')).toBe(1234);
    expect(readSeen(storage, 'run-b')).toBeNull();
    storage.data.set(SEEN_KEY, '{oops');
    expect(readSeen(storage, 'run-a')).toBeNull();
  });
});

describe('dealCurated (Draw again)', () => {
  const history: { adventureId: string; completedAt: number }[] = [];

  function draws(prefs: Prefs, count: number, times: number): string[][] {
    const out: string[][] = [];
    let previous: Draw | null = null;
    for (let i = 0; i < times; i++) {
      const seed = 1000 + i;
      const { picks, shownIds } = dealCurated(LIBRARY, prefs, { history, previous, count, seed });
      const envelopes = picks.map((p, slot) => ({ slot, status: 'ready' as const, source: 'curated' as const, adventure: p.adventure, opened: false }));
      previous = { id: `d${i}`, createdAt: T0, prefs, seed, envelopes, shownIds };
      out.push(picks.map((p) => p.adventure.id));
    }
    return out;
  }

  const combos: Prefs[] = [];
  for (const minutes of [15, 30, 60, 120] as const)
    for (const budget of [0, 30, 100] as const)
      for (const setting of ['home', 'outside'] as const)
        for (const company of ['solo', 'group'] as const) combos.push({ minutes, budget, setting, company, mood: 'curious', weirdness: 2 });

  it('shows every fitting episode within a few draws and never repeats the previous table when alternatives exist', () => {
    for (const prefs of combos) {
      const fitting = LIBRARY.filter((a) => fitsPrefs(a, prefs)).map((a) => a.id);
      if (fitting.length === 0) continue;
      for (const count of [2, 3]) {
        const rounds = Math.ceil(fitting.length / count) + 1;
        const seq = draws(prefs, count, rounds);
        const seen = new Set(seq.flat());
        expect([...seen].sort(), `${JSON.stringify(prefs)} count ${count}`).toEqual([...fitting].sort());
        for (const ids of seq) expect(ids.every((id) => fitting.includes(id))).toBe(true);
        if (fitting.length > count) {
          for (let i = 1; i < seq.length; i++) {
            expect(new Set(seq[i]), `${JSON.stringify(prefs)} draw ${i}`).not.toEqual(new Set(seq[i - 1]));
          }
        }
      }
    }
  });

  it('deals the full count whenever enough episodes fit', () => {
    for (const prefs of combos) {
      const fitting = LIBRARY.filter((a) => fitsPrefs(a, prefs)).length;
      for (const ids of draws(prefs, 3, 4)) expect(ids.length).toBe(Math.min(3, fitting));
    }
  });
});
