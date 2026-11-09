import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_PREFS } from '../shared/constants.ts';
import type { Prefs } from '../shared/types.ts';
import { validateAdventure } from '../shared/validate.ts';
import exemplar from '../src/content/adventures/undercover-tourist.ts';
import { mulberry32 } from '../src/engine/random.ts';
import {
  chooseOption,
  completeEpisode,
  completeStage,
  currentNode,
  isFinished,
  pathSummary,
  progressFraction,
  setNote,
  startRun,
} from '../src/engine/run.ts';
import type { Run } from '../src/engine/types.ts';
import {
  CORRUPT_BACKUP_KEY,
  STORAGE_KEY,
  clearState,
  defaultState,
  getBrowserStorage,
  loadState,
  sanitizeState,
  saveState,
} from '../src/state/persistence.ts';
import type { PersistedState, StorageLike } from '../src/state/types.ts';

const MIN = 60_000;
const T0 = Date.UTC(2026, 10, 8, 9);
const NOW = T0 + 24 * 60 * MIN;
const PREFS: Prefs = { minutes: 60, budget: 30, setting: 'outside', company: 'group', mood: 'creative', weirdness: 3 };

class MemoryStorage implements StorageLike {
  readonly data = new Map<string, string>();
  failGet: unknown = null;
  failSet: unknown = null;
  failRemove: unknown = null;

  getItem(key: string): string | null {
    if (this.failGet) throw this.failGet;
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    if (this.failSet) throw this.failSet;
    this.data.set(key, value);
  }
  removeItem(key: string): void {
    if (this.failRemove) throw this.failRemove;
    this.data.delete(key);
  }
}

function finishedRun(id: string, option: 'observe' | 'legend'): Run {
  let run = setNote(startRun(exemplar, PREFS, 1, T0, id), 'detail', 'a door painted the wrong blue');
  run = completeStage(run, T0 + 8 * MIN);
  run = chooseOption(run, option, T0 + 9 * MIN);
  run = completeStage(run, T0 + 20 * MIN);
  return completeStage(run, T0 + 28 * MIN);
}

/** A realistic state touching every field: a draw, a run waiting at the fork, two completed episodes. */
function fullState(): PersistedState {
  const live = completeStage(setNote(startRun(exemplar, PREFS, 3, T0, 'run-live'), 'detail', 'blue door'), T0 + 5 * MIN);
  return {
    version: 1,
    prefs: PREFS,
    draw: {
      id: 'draw-1',
      createdAt: T0,
      prefs: PREFS,
      seed: 12345,
      envelopes: [
        { slot: 0, status: 'ready', source: 'curated', adventure: exemplar, opened: true },
        { slot: 1, status: 'writing', source: 'ai', adventure: null, opened: false, note: 'Written for you' },
        { slot: 2, status: 'failed', source: 'ai', adventure: null, opened: false },
      ],
      shownIds: [exemplar.id],
    },
    run: live,
    completed: [
      completeEpisode(finishedRun('run-a', 'observe'), T0 + 30 * MIN, 'Slow is a superpower.'),
      completeEpisode(finishedRun('run-b', 'legend'), T0 + 31 * MIN),
    ],
    series: { name: 'Season of Doors', namePromptDone: true },
    settings: { motion: 'reduce' },
    updatedAt: T0,
  };
}

/** The state as it comes back from JSON (drops undefined, copies everything). */
const asJson = (value: unknown): unknown => JSON.parse(JSON.stringify(value));

const withoutUpdatedAt = (state: PersistedState) => ({ ...state, updatedAt: 0 });

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('defaultState', () => {
  it('is a clean, valid starting state', () => {
    const state = defaultState(NOW);
    expect(state).toEqual({
      version: 1,
      prefs: DEFAULT_PREFS,
      draw: null,
      run: null,
      completed: [],
      series: { name: null, namePromptDone: false },
      settings: { motion: 'system' },
      updatedAt: NOW,
    });
    expect(state.prefs).not.toBe(DEFAULT_PREFS);
    expect(sanitizeState(state, NOW)).toEqual({ state, repaired: false });
  });
});

describe('loadState / saveState', () => {
  it('starts fresh when nothing is stored', () => {
    expect(loadState(new MemoryStorage(), NOW)).toEqual({ state: defaultState(NOW), status: 'fresh' });
  });

  it('round-trips a full state', () => {
    const storage = new MemoryStorage();
    const state = fullState();
    expect(saveState(state, storage)).toEqual({ ok: true });
    const loaded = loadState(storage, NOW);
    expect(loaded.status).toBe('loaded');
    expect(loaded.message).toBeUndefined();
    expect(withoutUpdatedAt(loaded.state)).toEqual(withoutUpdatedAt(asJson(state) as PersistedState));
  });

  it('restores a run the engine can keep playing', () => {
    const storage = new MemoryStorage();
    saveState(fullState(), storage);
    const run = loadState(storage, NOW).state.run;
    expect(run?.phase).toBe('choice');
    const next = chooseOption(run!, 'legend', NOW);
    expect(currentNode(next)?.id).toBe('legend-maker');
    expect(pathSummary(next)[0].note).toBe('blue door');
  });

  it('sets updatedAt on save without mutating the state', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW + 5000);
    const storage = new MemoryStorage();
    const state = defaultState(T0);
    saveState(state, storage);
    expect(state.updatedAt).toBe(T0);
    expect(JSON.parse(storage.data.get(STORAGE_KEY)!).updatedAt).toBe(NOW + 5000);
  });

  it('backs up corrupt JSON and resets calmly', () => {
    const storage = new MemoryStorage();
    storage.data.set(STORAGE_KEY, '{"version":1,"prefs":');
    const result = loadState(storage, NOW);
    expect(result.status).toBe('reset-corrupt');
    expect(result.state).toEqual(defaultState(NOW));
    expect(result.message).toMatch(/started fresh/);
    expect(result.message).toMatch(/copy/);
    expect(storage.data.get(CORRUPT_BACKUP_KEY)).toBe('{"version":1,"prefs":');
  });

  it('still resets when the backup itself cannot be written', () => {
    const storage = new MemoryStorage();
    storage.data.set(STORAGE_KEY, 'not json');
    storage.failSet = new DOMException('full', 'QuotaExceededError');
    const result = loadState(storage, NOW);
    expect(result.status).toBe('reset-corrupt');
    expect(result.message).not.toMatch(/copy/);
  });

  it.each(['42', '"hello"', 'null', '[]', '[{"version":1}]', 'true'])('treats non-object JSON %s as corrupt', (raw) => {
    const storage = new MemoryStorage();
    storage.data.set(STORAGE_KEY, raw);
    expect(loadState(storage, NOW).status).toBe('reset-corrupt');
    expect(storage.data.get(CORRUPT_BACKUP_KEY)).toBe(raw);
  });

  it('reports repairs with a message', () => {
    const storage = new MemoryStorage();
    const state = fullState();
    storage.data.set(STORAGE_KEY, JSON.stringify({ ...state, prefs: { ...state.prefs, minutes: 45 } }));
    const result = loadState(storage, NOW);
    expect(result.status).toBe('repaired');
    expect(result.message).toBeTruthy();
    expect(result.state.prefs).toEqual({ ...PREFS, minutes: DEFAULT_PREFS.minutes });
    expect(result.state.completed).toHaveLength(2);
  });

  it('copes with missing or blocked storage', () => {
    expect(loadState(null, NOW)).toMatchObject({ state: defaultState(NOW), status: 'unavailable' });
    expect(loadState(null, NOW).message).toBeTruthy();
    const blocked = new MemoryStorage();
    blocked.failGet = new DOMException('denied', 'SecurityError');
    expect(loadState(blocked, NOW).status).toBe('unavailable');
    expect(saveState(defaultState(), null)).toEqual({ ok: false, reason: 'unavailable' });
  });

  it('maps storage errors on save', () => {
    const cases: Array<[unknown, string]> = [
      [new DOMException('full', 'QuotaExceededError'), 'quota'],
      [Object.assign(new Error('full'), { code: 22 }), 'quota'],
      [{ name: 'NS_ERROR_DOM_QUOTA_REACHED' }, 'quota'],
      [new DOMException('denied', 'SecurityError'), 'unavailable'],
      [new Error('disk on fire'), 'unknown'],
      ['a string was thrown', 'unknown'],
    ];
    for (const [error, reason] of cases) {
      const storage = new MemoryStorage();
      storage.failSet = error;
      expect(saveState(defaultState(), storage)).toEqual({ ok: false, reason });
    }
  });

  it('reports unserializable state as an unknown failure instead of throwing', () => {
    const storage = new MemoryStorage();
    // JSON.stringify throws on BigInt.
    const weird = { ...defaultState(), settings: { motion: 'system', extra: 1n } } as unknown as PersistedState;
    expect(saveState(weird, storage)).toEqual({ ok: false, reason: 'unknown' });
    expect(storage.data.has(STORAGE_KEY)).toBe(false);
  });

  it('uses the browser storage by default', () => {
    expect(loadState(undefined, NOW).status).toBe('unavailable'); // no window in node
    const storage = new MemoryStorage();
    vi.stubGlobal('window', { localStorage: storage });
    expect(saveState(defaultState(NOW))).toEqual({ ok: true });
    expect(loadState(undefined, NOW).status).toBe('loaded');
    clearState();
    expect(storage.data.has(STORAGE_KEY)).toBe(false);
  });
});

describe('clearState', () => {
  it('removes the saved state but keeps any corrupt backup', () => {
    const storage = new MemoryStorage();
    storage.data.set(STORAGE_KEY, '{}');
    storage.data.set(CORRUPT_BACKUP_KEY, 'old');
    clearState(storage);
    expect([...storage.data.keys()]).toEqual([CORRUPT_BACKUP_KEY]);
  });

  it('never throws', () => {
    const storage = new MemoryStorage();
    storage.failRemove = new DOMException('denied', 'SecurityError');
    expect(() => clearState(storage)).not.toThrow();
    expect(() => clearState(null)).not.toThrow();
  });
});

describe('getBrowserStorage', () => {
  it('is null outside a browser', () => {
    expect(getBrowserStorage()).toBeNull();
  });

  it('returns window.localStorage when it can be read — even if it is full', () => {
    const storage = new MemoryStorage();
    storage.failSet = new DOMException('full', 'QuotaExceededError');
    vi.stubGlobal('window', { localStorage: storage });
    expect(getBrowserStorage()).toBe(storage);
    expect(storage.data.size).toBe(0); // it never writes a probe
  });

  it('is null when localStorage throws on access or on use', () => {
    vi.stubGlobal('window', {
      get localStorage(): StorageLike {
        throw new DOMException('denied', 'SecurityError');
      },
    });
    expect(getBrowserStorage()).toBeNull();
    const broken = new MemoryStorage();
    broken.failGet = new DOMException('denied', 'SecurityError');
    vi.stubGlobal('window', { localStorage: broken });
    expect(getBrowserStorage()).toBeNull();
    vi.stubGlobal('window', { localStorage: null });
    expect(getBrowserStorage()).toBeNull();
  });
});

describe('sanitizeState', () => {
  it('keeps a valid state exactly, with repaired false', () => {
    const state = asJson(fullState()) as PersistedState;
    expect(sanitizeState(state, NOW)).toEqual({ state, repaired: false });
  });

  it('never throws on garbage', () => {
    const cyclic: Record<string, unknown> = { version: 1 };
    cyclic.self = cyclic;
    cyclic.prefs = cyclic;
    cyclic.completed = [cyclic, cyclic];
    const garbage: unknown[] = [
      null,
      undefined,
      0,
      Number.NaN,
      'plot twist',
      true,
      [],
      [1, 2, 3],
      () => 1,
      Symbol('x'),
      new Date(),
      { version: 'one', prefs: [], draw: 7, run: 'run', completed: {}, series: 3, settings: [], updatedAt: 'now' },
      { version: 1, draw: { id: 'd', envelopes: [null, 4, { slot: 'x', adventure: { id: 'Bad Id' } }] } },
      { version: 1, run: { adventure: exemplar }, completed: [null, {}, { id: 3 }] },
      cyclic,
      {
        version: 1,
        get completed(): never {
          throw new Error('boom');
        },
      },
    ];
    for (const input of garbage) {
      const { state, repaired } = sanitizeState(input, NOW);
      expect(repaired).toBe(true);
      expect(sanitizeState(state, NOW)).toEqual({ state, repaired: false });
    }
  });

  it('fixes invalid prefs field by field', () => {
    const raw = { ...defaultState(NOW), prefs: { minutes: 45, budget: 30, setting: 'moon', company: 'group', mood: 'bored', weirdness: 2 } };
    const { state, repaired } = sanitizeState(raw, NOW);
    expect(repaired).toBe(true);
    expect(state.prefs).toEqual({ minutes: 30, budget: 30, setting: 'outside', company: 'group', mood: 'curious', weirdness: 2 });
  });

  it('turns envelopes with invalid adventures into failed, empty envelopes', () => {
    const state = asJson(fullState()) as PersistedState;
    const broken = structuredClone(exemplar) as unknown as Record<string, unknown>;
    broken.nodes = [];
    state.draw!.envelopes[0].adventure = broken as never;
    state.draw!.envelopes.push({ slot: 3, status: 'ready', source: 'ai', adventure: null, opened: false });
    const { state: clean, repaired } = sanitizeState(state, NOW);
    expect(repaired).toBe(true);
    expect(clean.draw!.envelopes[0]).toEqual({ slot: 0, status: 'failed', source: 'curated', adventure: null, opened: true });
    expect(clean.draw!.envelopes[1].status).toBe('writing');
    expect(clean.draw!.envelopes[3]).toMatchObject({ status: 'failed', adventure: null });
  });

  it('keeps the key of an AI envelope being written, and drops a broken one', () => {
    const state = asJson(fullState()) as PersistedState;
    state.draw!.envelopes[1].genKey = 'gen-abc';
    expect(sanitizeState(asJson(state), NOW).state.draw!.envelopes[1].genKey).toBe('gen-abc');
    (state.draw!.envelopes[1] as unknown as Record<string, unknown>).genKey = 42;
    const { state: clean, repaired } = sanitizeState(asJson(state), NOW);
    expect(repaired).toBe(true);
    expect(clean.draw!.envelopes[1].genKey).toBeUndefined();
    expect(clean.draw!.envelopes[1].status).toBe('writing');
  });

  it('repairs draw details and drops a draw without a usable shape', () => {
    const state = asJson(fullState()) as PersistedState;
    const draw = state.draw as unknown as Record<string, unknown>;
    draw.prefs = { minutes: 'lots' };
    draw.shownIds = ['undercover-tourist', 7, null];
    draw.seed = 'seed';
    const { state: clean } = sanitizeState(state, NOW);
    expect(clean.draw!.prefs).toEqual({ ...PREFS }); // falls back to the user's (valid) prefs
    expect(clean.draw!.shownIds).toEqual(['undercover-tourist']);
    expect(clean.draw!.seed).toBe(0);
    expect(sanitizeState({ ...state, draw: { id: 'd' } }, NOW).state.draw).toBeNull();
  });

  it('discards a run whose adventure is invalid', () => {
    const state = asJson(fullState()) as PersistedState;
    (state.run!.adventure as unknown as Record<string, unknown>).start = 'nowhere';
    const { state: clean, repaired } = sanitizeState(state, NOW);
    expect(repaired).toBe(true);
    expect(clean.run).toBeNull();
    expect(clean.completed).toHaveLength(2);
  });

  it.each<[string, (run: Record<string, unknown>) => void]>([
    ['an unknown current node', (run) => (run.nodeId = 'nowhere')],
    ['a choice phase on a node without a choice', (run) => ((run.nodeId = 'slow-tour'), (run.steps = []))],
    ['an ending without a finish time', (run) => (run.endingId = 'quiet-detective')],
    ['a finished run whose clock is still running', (run) => ((run.endingId = 'quiet-detective'), (run.finishedAt = T0))],
    ['a step on an unknown node', (run) => ((run.steps as unknown[]).push({ nodeId: 'ghost', stage: 2, usedAlternative: false, completedAt: T0 }))],
    ['a step with an unknown option', (run) => ((run.steps as Array<Record<string, unknown>>)[0].optionId = 'teleport')],
    ['a negative elapsed time', (run) => (run.elapsedMs = -5)],
    ['a missing id', (run) => delete run.id],
  ])('discards a run with %s', (_name, mutate) => {
    const state = asJson(fullState()) as PersistedState;
    mutate(state.run as unknown as Record<string, unknown>);
    expect(sanitizeState(state, NOW)).toMatchObject({ state: { run: null }, repaired: true });
  });

  it('keeps a run but drops notes that are not capture keys or not text', () => {
    const state = asJson(fullState()) as PersistedState;
    (state.run!.notes as Record<string, unknown>) = { detail: '  blue   door ', bogus: 'x', oldest: 42 };
    const { state: clean, repaired } = sanitizeState(state, NOW);
    expect(repaired).toBe(true);
    expect(clean.run!.notes).toEqual({ detail: 'blue door' });
  });

  it('keeps finished runs and their stopped clock', () => {
    const state = { ...defaultState(NOW), run: asJson(finishedRun('run-done', 'legend')) };
    const { state: clean, repaired } = sanitizeState(state, NOW);
    expect(repaired).toBe(false);
    expect(isFinished(clean.run!)).toBe(true);
    expect(completeEpisode(clean.run!, NOW).endingId).toBe('unofficial-historian');
  });

  it('drops completed episodes missing required fields and duplicates', () => {
    const state = asJson(fullState()) as PersistedState;
    const [first, second] = state.completed as unknown as Array<Record<string, unknown>>;
    const noTitle: Record<string, unknown> = { ...first, id: 'x1' };
    delete noTitle.title;
    const badPalette = { ...first, id: 'x2', palette: 'hotdog' };
    const badDate = { ...first, id: 'x3', completedAt: 'yesterday' };
    state.completed = [first, second, { ...first }, noTitle, badPalette, badDate, null, 'episode'] as never;
    const { state: clean, repaired } = sanitizeState(state, NOW);
    expect(repaired).toBe(true);
    expect(clean.completed.map((ep) => ep.id)).toEqual(['run-a', 'run-b']);
  });

  it('repairs optional fields of completed episodes instead of dropping them', () => {
    const state = asJson(fullState()) as PersistedState;
    const ep = state.completed[0] as unknown as Record<string, unknown>;
    delete ep.journal;
    delete ep.twist;
    ep.award = 'lots of points';
    ep.posterSeed = null;
    ep.notes = { detail: 'blue', __proto__x: 'nope', ['__proto__']: 'nope' };
    (ep.steps as unknown[]).push({ stage: 9 }, 'step');
    ep.narrator = 5;
    const { state: clean, repaired } = sanitizeState(state, NOW);
    expect(repaired).toBe(true);
    const fixed = clean.completed[0];
    expect(fixed).toMatchObject({ id: 'run-a', journal: '', twist: '', award: { points: { curiosity: 0, creativity: 0, boldness: 0, connection: 0 }, lines: [] } });
    expect(typeof fixed.posterSeed).toBe('number');
    expect(fixed.notes).toEqual({ detail: 'blue' });
    expect(fixed.steps).toHaveLength(3);
    expect('narrator' in fixed).toBe(false);
  });

  it('repairs series and settings', () => {
    const raw = { ...defaultState(NOW), series: { name: '   ', namePromptDone: 'yes' }, settings: { motion: 'wobbly' } };
    const { state } = sanitizeState(raw, NOW);
    expect(state.series).toEqual({ name: null, namePromptDone: false });
    expect(state.settings).toEqual({ motion: 'system' });
    const long = sanitizeState({ ...defaultState(NOW), series: { name: 'S'.repeat(500), namePromptDone: true } }, NOW).state;
    expect(long.series.name).toHaveLength(120);
  });

  it('flags an unexpected version but still reads what it can', () => {
    const state = { ...(asJson(fullState()) as PersistedState), version: 7 };
    const { state: clean, repaired } = sanitizeState(state, NOW);
    expect(repaired).toBe(true);
    expect(clean.version).toBe(1);
    expect(clean.completed).toHaveLength(2);
  });

  it('always produces a stable, playable state from randomly damaged saves', () => {
    const source = asJson(fullState());
    const rng = mulberry32(2026);
    const junk: unknown[] = [null, 0, -1, 42.5, Number.NaN, Number.POSITIVE_INFINITY, '', 'junk', true, [], {}, [null], { id: 7 }];
    for (let i = 0; i < 400; i++) {
      const damaged = structuredClone(source);
      for (let edits = 1 + Math.floor(rng() * 3); edits > 0; edits--) damage(damaged, rng, junk);
      const once = sanitizeState(damaged, NOW);
      const twice = sanitizeState(once.state, NOW);
      expect(twice.repaired).toBe(false);
      expect(twice.state).toEqual(once.state);
      const run = once.state.run;
      if (run) {
        expect(validateAdventure(run.adventure).ok).toBe(true);
        expect(currentNode(run)).not.toBeNull();
        expect(progressFraction(run)).toBeGreaterThanOrEqual(0);
        expect(() => pathSummary(run)).not.toThrow();
        if (isFinished(run)) expect(() => completeEpisode(run, NOW)).not.toThrow();
      }
      for (const env of once.state.draw?.envelopes ?? []) {
        if (env.adventure) expect(validateAdventure(env.adventure).ok).toBe(true);
        else expect(env.status).not.toBe('ready');
      }
    }
  });
});

/** Deletes or overwrites one random value somewhere in a JSON tree. */
function damage(root: unknown, rng: () => number, junk: readonly unknown[]): void {
  const slots: Array<{ parent: Record<string, unknown> | unknown[]; key: string | number }> = [];
  const walk = (node: unknown) => {
    if (Array.isArray(node)) {
      node.forEach((child, i) => {
        slots.push({ parent: node, key: i });
        walk(child);
      });
    } else if (typeof node === 'object' && node !== null) {
      for (const [key, child] of Object.entries(node)) {
        slots.push({ parent: node as Record<string, unknown>, key });
        walk(child);
      }
    }
  };
  walk(root);
  if (slots.length === 0) return;
  const { parent, key } = slots[Math.floor(rng() * slots.length)];
  const replacement = junk[Math.floor(rng() * junk.length)];
  if (rng() < 0.3) {
    if (Array.isArray(parent)) parent.splice(key as number, 1);
    else delete parent[key as string];
  } else if (Array.isArray(parent)) parent[key as number] = structuredClone(replacement);
  else parent[key as string] = structuredClone(replacement);
}
