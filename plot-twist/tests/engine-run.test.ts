import { describe, expect, it } from 'vitest';
import { MAX_NOTE_LENGTH } from '../shared/constants.ts';
import type { Adventure, Prefs } from '../shared/types.ts';
import exemplar from '../src/content/adventures/undercover-tourist.ts';
import { hashSeed } from '../src/engine/random.ts';
import {
  chooseOption,
  completeEpisode,
  completeStage,
  currentNode,
  elapsedMs,
  isFinished,
  isPaused,
  pathSummary,
  pauseRun,
  progressFraction,
  recoverRun,
  resumeRun,
  setNote,
  startRun,
  toggleAlternative,
  touchRun,
} from '../src/engine/run.ts';
import type { Run } from '../src/engine/types.ts';

const MIN = 60_000;
const T0 = Date.UTC(2026, 10, 8, 9);
const PREFS: Prefs = { minutes: 30, budget: 0, setting: 'outside', company: 'solo', mood: 'curious', weirdness: 2 };

const start = (adv: Adventure = exemplar, id = 'run-test') => startRun(adv, PREFS, 4, T0, id);

/** Completes every stage `stepMs` apart, taking `optionId` at each fork. */
function playThrough(run: Run, optionId: string, from: number, stepMs = 5 * MIN): { run: Run; now: number } {
  let current = run;
  let now = from;
  for (let guard = 0; !isFinished(current); guard++) {
    if (guard > 10) throw new Error('run did not finish');
    now += stepMs;
    current = current.phase === 'choice' ? chooseOption(current, optionId, now) : completeStage(current, now);
  }
  return { run: current, now };
}

function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

describe('startRun', () => {
  it('starts running immediately at the start node, in the action phase', () => {
    const run = start();
    expect(run).toMatchObject({
      id: 'run-test',
      episodeNumber: 4,
      prefs: PREFS,
      startedAt: T0,
      elapsedMs: 0,
      runningSince: T0,
      lastSeenAt: T0,
      nodeId: 'arrive',
      phase: 'action',
      usingAlternative: false,
      steps: [],
      notes: {},
      endingId: null,
      finishedAt: null,
    });
    expect(currentNode(run)?.title).toBe('Arrive Like a Stranger');
    expect(isPaused(run)).toBe(false);
    expect(isFinished(run)).toBe(false);
  });

  it('keeps a detached snapshot of the adventure', () => {
    const run = start();
    expect(run.adventure).toEqual(exemplar);
    expect(run.adventure).not.toBe(exemplar);
    expect(run.adventure.nodes).not.toBe(exemplar.nodes);
  });

  it('generates an id when none is given', () => {
    const a = startRun(exemplar, PREFS, 1, T0);
    const b = startRun(exemplar, PREFS, 1, T0);
    expect(a.id).toMatch(/^run-[0-9a-z]+$/);
    expect(a.id).not.toBe(b.id);
  });

  it('refuses an adventure whose start node is missing', () => {
    expect(() => start({ ...exemplar, start: 'nowhere' })).toThrow(/start node/);
  });
});

describe('timer', () => {
  it('counts running time', () => {
    const run = start();
    expect(elapsedMs(run, T0)).toBe(0);
    expect(elapsedMs(run, T0 + 5 * MIN)).toBe(5 * MIN);
  });

  it('never counts paused time', () => {
    let run = start();
    run = pauseRun(run, T0 + 5 * MIN);
    expect(isPaused(run)).toBe(true);
    expect(elapsedMs(run, T0 + 5 * MIN)).toBe(5 * MIN);
    expect(elapsedMs(run, T0 + 65 * MIN)).toBe(5 * MIN);
    run = resumeRun(run, T0 + 65 * MIN);
    expect(isPaused(run)).toBe(false);
    expect(elapsedMs(run, T0 + 70 * MIN)).toBe(10 * MIN);
    run = pauseRun(run, T0 + 72 * MIN);
    run = resumeRun(run, T0 + 100 * MIN);
    expect(elapsedMs(run, T0 + 101 * MIN)).toBe(13 * MIN);
  });

  it('makes pause and resume idempotent', () => {
    const running = start();
    expect(resumeRun(running, T0 + MIN)).toBe(running);
    const paused = pauseRun(running, T0 + 2 * MIN);
    expect(pauseRun(paused, T0 + 9 * MIN)).toBe(paused);
    expect(elapsedMs(pauseRun(paused, T0 + 9 * MIN), T0 + 9 * MIN)).toBe(2 * MIN);
    const resumed = resumeRun(paused, T0 + 10 * MIN);
    expect(resumeRun(resumed, T0 + 11 * MIN)).toBe(resumed);
  });

  it('never subtracts time when the clock jumps backwards', () => {
    expect(elapsedMs(start(), T0 - 10 * MIN)).toBe(0);
  });

  it('keeps the clock running while a choice is pending', () => {
    const run = completeStage(start(), T0 + 8 * MIN);
    expect(run.phase).toBe('choice');
    expect(isPaused(run)).toBe(false);
    expect(elapsedMs(run, T0 + 10 * MIN)).toBe(10 * MIN);
  });

  it('updates lastSeenAt on touch', () => {
    const run = start();
    expect(touchRun(run, T0).lastSeenAt).toBe(T0);
    expect(touchRun(run, T0)).toBe(run);
    expect(touchRun(run, T0 + MIN)).toEqual({ ...run, lastSeenAt: T0 + MIN });
  });
});

describe('stages and choices', () => {
  it('moves a stage with a choice into the choice phase and records the step', () => {
    const run = completeStage(start(), T0 + 8 * MIN);
    expect(run.phase).toBe('choice');
    expect(run.nodeId).toBe('arrive');
    expect(run.steps).toEqual([{ nodeId: 'arrive', stage: 1, usedAlternative: false, completedAt: T0 + 8 * MIN }]);
    expect(completeStage(run, T0 + 9 * MIN)).toBe(run);
  });

  it('only accepts a choice in the choice phase, and only a real option', () => {
    const acting = start();
    expect(chooseOption(acting, 'observe', T0 + MIN)).toBe(acting);
    const choosing = completeStage(acting, T0 + 8 * MIN);
    expect(chooseOption(choosing, 'teleport', T0 + 9 * MIN)).toBe(choosing);
  });

  it('stores the option on the step and moves to the chosen branch', () => {
    const run = chooseOption(completeStage(start(), T0 + 8 * MIN), 'legend', T0 + 9 * MIN);
    expect(run.steps).toEqual([{ nodeId: 'arrive', stage: 1, usedAlternative: false, completedAt: T0 + 8 * MIN, optionId: 'legend' }]);
    expect(run).toMatchObject({ nodeId: 'legend-maker', phase: 'action', usingAlternative: false });
  });

  it('follows `next` from stages without a choice', () => {
    const atStage2 = chooseOption(completeStage(start(), T0 + 8 * MIN), 'observe', T0 + 9 * MIN);
    const atStage3 = completeStage(atStage2, T0 + 20 * MIN);
    expect(atStage3).toMatchObject({ nodeId: 'field-report', phase: 'action' });
    expect(atStage3.steps.map((s) => s.nodeId)).toEqual(['arrive', 'slow-tour']);
  });

  it('reaches different endings with different content on each branch', () => {
    const a = playThrough(start(), 'observe', T0).run;
    const b = playThrough(start(), 'legend', T0).run;
    expect(a.endingId).toBe('quiet-detective');
    expect(b.endingId).toBe('unofficial-historian');
    expect(a.steps.map((s) => s.nodeId)).toEqual(['arrive', 'slow-tour', 'field-report']);
    expect(b.steps.map((s) => s.nodeId)).toEqual(['arrive', 'legend-maker', 'gift-shop']);
    const [sa, sb] = [pathSummary(a), pathSummary(b)];
    // Same first stage; only the choice differs.
    expect(sa[0]).toEqual({ ...sb[0], choiceLabel: 'Follow the details' });
    for (const i of [1, 2]) {
      expect(sa[i].title).not.toBe(sb[i].title);
      expect(sa[i].action).not.toBe(sb[i].action);
    }
    const ea = completeEpisode(a, T0 + 30 * MIN);
    const eb = completeEpisode(b, T0 + 30 * MIN);
    expect(ea.endingTitle).not.toBe(eb.endingTitle);
    expect(ea.twist).not.toBe(eb.twist);
    expect(ea.closingLine).not.toBe(eb.closingLine);
  });

  it('records alternative usage per stage and resets it on the next stage', () => {
    let run = toggleAlternative(start());
    expect(run.usingAlternative).toBe(true);
    run = completeStage(run, T0 + 8 * MIN);
    expect(run.steps[0].usedAlternative).toBe(true);
    expect(toggleAlternative(run)).toBe(run); // ignored during the choice
    run = chooseOption(run, 'observe', T0 + 9 * MIN);
    expect(run.usingAlternative).toBe(false);
    run = completeStage(run, T0 + 20 * MIN);
    expect(run.steps[1].usedAlternative).toBe(false);
    run = toggleAlternative(toggleAlternative(run)); // toggled back
    run = completeStage(run, T0 + 28 * MIN);
    expect(run.steps.map((s) => s.usedAlternative)).toEqual([true, false, false]);
    const summary = pathSummary(run);
    expect(summary[0].action).toBe(exemplar.nodes[0].alternative);
    expect(summary[1].action).toBe(exemplar.nodes[1].action);
  });

  it('resumes a paused run implicitly when a stage is completed', () => {
    let run = pauseRun(start(), T0 + 5 * MIN);
    run = completeStage(run, T0 + 60 * MIN);
    expect(isPaused(run)).toBe(false);
    expect(elapsedMs(run, T0 + 60 * MIN)).toBe(5 * MIN);
    expect(elapsedMs(run, T0 + 62 * MIN)).toBe(7 * MIN);
    run = pauseRun(run, T0 + 62 * MIN);
    run = chooseOption(run, 'observe', T0 + 90 * MIN);
    expect(isPaused(run)).toBe(false);
    expect(elapsedMs(run, T0 + 90 * MIN)).toBe(7 * MIN);
  });

  it('stops the clock when the episode finishes and then ignores further input', () => {
    const { run, now } = playThrough(start(), 'observe', T0, 6 * MIN);
    expect(isFinished(run)).toBe(true);
    expect(isPaused(run)).toBe(false);
    expect(run.finishedAt).toBe(now);
    expect(run.runningSince).toBeNull();
    expect(run.nodeId).toBe('field-report');
    expect(elapsedMs(run, now)).toBe(24 * MIN);
    expect(elapsedMs(run, now + 600 * MIN)).toBe(24 * MIN);
    expect(pauseRun(run, now + MIN)).toBe(run);
    expect(resumeRun(run, now + MIN)).toBe(run);
    expect(completeStage(run, now + MIN)).toBe(run);
    expect(chooseOption(run, 'observe', now + MIN)).toBe(run);
    expect(toggleAlternative(run)).toBe(run);
  });

  it('can finish from a stage-3 choice', () => {
    const adv: Adventure = structuredClone(exemplar);
    const fieldReport = adv.nodes.find((n) => n.id === 'field-report')!;
    delete fieldReport.next;
    fieldReport.choice = {
      prompt: 'Publish it?',
      options: [
        { id: 'publish', label: 'Publish', description: 'Tell everyone.', next: 'quiet-detective' },
        { id: 'keep', label: 'Keep it', description: 'A secret.', next: 'unofficial-historian' },
      ],
    };
    let run = completeStage(start(adv), T0 + MIN);
    run = chooseOption(run, 'observe', T0 + 2 * MIN);
    run = completeStage(run, T0 + 3 * MIN);
    const atFork = completeStage(run, T0 + 4 * MIN);
    expect(atFork).toMatchObject({ nodeId: 'field-report', phase: 'choice', endingId: null });
    expect(isFinished(atFork)).toBe(false);
    expect(progressFraction(atFork)).toBe(1); // all three stages are done; only the ending is left to pick
    const done = chooseOption(atFork, 'keep', T0 + 5 * MIN);
    expect(done).toMatchObject({ endingId: 'unofficial-historian', finishedAt: T0 + 5 * MIN, runningSince: null, phase: 'action' });
    expect(done.steps.at(-1)?.optionId).toBe('keep');
    expect(elapsedMs(done, T0 + 50 * MIN)).toBe(5 * MIN);
  });

  it('never mutates its input', () => {
    const run = deepFreeze(start());
    const snapshot = structuredClone(run);
    const noted = setNote(toggleAlternative(run), 'detail', 'a door painted the wrong blue');
    const paused = pauseRun(noted, T0 + MIN);
    recoverRun(paused, T0 + 999 * MIN);
    recoverRun(run, T0 + 999 * MIN);
    const { run: done, now } = playThrough(resumeRun(paused, T0 + 2 * MIN), 'legend', T0 + 2 * MIN);
    completeEpisode(deepFreeze(done), now, 'journal');
    expect(run).toEqual(snapshot);
  });
});

describe('notes', () => {
  it('stores cleaned notes for capture keys', () => {
    const run = setNote(start(), 'detail', '  a door\tpainted   the wrong\nblue  ');
    expect(run.notes).toEqual({ detail: 'a door painted the wrong blue' });
    expect(setNote(start(), 'detail', 'a\u0000b').notes).toEqual({ detail: 'ab' });
    const long = setNote(start(), 'detail', 'x'.repeat(200));
    expect(long.notes.detail).toHaveLength(MAX_NOTE_LENGTH);
    expect(long.notes.detail.endsWith('…')).toBe(true);
  });

  it('clears a note when it is emptied and ignores unknown keys', () => {
    const run = setNote(start(), 'detail', 'blue door');
    expect(setNote(run, 'detail', '   ').notes).toEqual({});
    expect(setNote(run, 'not-a-capture', 'x')).toBe(run);
    expect(setNote(run, 'detail', 'blue door')).toBe(run);
  });
});

describe('recoverRun', () => {
  const lastSeen = T0 + 10 * MIN;
  const seenRun = () => touchRun(start(), lastSeen);

  it('keeps counting a normal absence (the phone locked during the activity)', () => {
    const { run, autoPaused } = recoverRun(seenRun(), lastSeen + 20 * MIN);
    expect(autoPaused).toBe(false);
    expect(isPaused(run)).toBe(false);
    expect(run.lastSeenAt).toBe(lastSeen + 20 * MIN);
    expect(elapsedMs(run, lastSeen + 20 * MIN)).toBe(30 * MIN);
  });

  it('auto-pauses after a long absence, crediting at most maxAwayMs', () => {
    // Default allowance for a 30-minute episode: max(45 min, 2 × 30 min) = 60 min.
    const now = lastSeen + 180 * MIN;
    const { run, autoPaused } = recoverRun(seenRun(), now);
    expect(autoPaused).toBe(true);
    expect(isPaused(run)).toBe(true);
    expect(run.lastSeenAt).toBe(now);
    expect(elapsedMs(run, now)).toBe(10 * MIN + 60 * MIN);
    expect(elapsedMs(run, now + 60 * MIN)).toBe(70 * MIN);
  });

  it('treats an absence of exactly maxAwayMs as normal', () => {
    expect(recoverRun(seenRun(), lastSeen + 60 * MIN).autoPaused).toBe(false);
    expect(recoverRun(seenRun(), lastSeen + 60 * MIN + 1).autoPaused).toBe(true);
  });

  it('never allows less than 45 minutes away by default', () => {
    const short: Adventure = { ...structuredClone(exemplar), minutes: 15 };
    const run = touchRun(start(short), lastSeen);
    expect(recoverRun(run, lastSeen + 44 * MIN).autoPaused).toBe(false);
    const recovered = recoverRun(run, lastSeen + 50 * MIN);
    expect(recovered.autoPaused).toBe(true);
    expect(elapsedMs(recovered.run, lastSeen + 50 * MIN)).toBe(10 * MIN + 45 * MIN);
  });

  it('accepts a custom allowance', () => {
    const recovered = recoverRun(seenRun(), lastSeen + 20 * MIN, 5 * MIN);
    expect(recovered.autoPaused).toBe(true);
    expect(elapsedMs(recovered.run, lastSeen + 20 * MIN)).toBe(15 * MIN);
  });

  it('only touches paused and finished runs', () => {
    const paused = pauseRun(seenRun(), lastSeen);
    const fromPause = recoverRun(paused, lastSeen + 999 * MIN);
    expect(fromPause.autoPaused).toBe(false);
    expect(fromPause.run).toEqual({ ...paused, lastSeenAt: lastSeen + 999 * MIN });
    const { run: done, now } = playThrough(start(), 'observe', T0);
    const fromFinish = recoverRun(done, now + 999 * MIN);
    expect(fromFinish.autoPaused).toBe(false);
    expect(elapsedMs(fromFinish.run, now + 999 * MIN)).toBe(elapsedMs(done, now));
  });
});

describe('progressFraction', () => {
  it('advances by completed stages and reaches 1 when finished', () => {
    let run = start();
    expect(progressFraction(run)).toBe(0);
    run = completeStage(run, T0 + MIN);
    expect(progressFraction(run)).toBeCloseTo(1 / 3);
    run = chooseOption(run, 'observe', T0 + 2 * MIN);
    expect(progressFraction(run)).toBeCloseTo(1 / 3);
    run = completeStage(run, T0 + 3 * MIN);
    expect(progressFraction(run)).toBeCloseTo(2 / 3);
    run = completeStage(run, T0 + 4 * MIN);
    expect(progressFraction(run)).toBe(1);
  });
});

describe('pathSummary', () => {
  it('summarizes the path with choices and the notes actually written', () => {
    let run = setNote(start(), 'detail', 'a door painted the wrong blue');
    run = completeStage(run, T0 + MIN);
    run = chooseOption(run, 'observe', T0 + 2 * MIN);
    run = completeStage(run, T0 + 3 * MIN); // no note for "oldest"
    expect(pathSummary(run)).toEqual([
      {
        stage: 1,
        nodeId: 'arrive',
        title: 'Arrive Like a Stranger',
        action: exemplar.nodes[0].action,
        usedAlternative: false,
        choicePrompt: 'Your guidebook is blank. How do you fill it?',
        choiceLabel: 'Follow the details',
        noteLabel: 'The strangest detail you found',
        note: 'a door painted the wrong blue',
      },
      {
        stage: 2,
        nodeId: 'slow-tour',
        title: 'The Slow Tour',
        action: exemplar.nodes[1].action,
        usedAlternative: false,
      },
    ]);
  });

  it('renders note tokens in the action text', () => {
    const adv: Adventure = structuredClone(exemplar);
    adv.nodes[1].action = 'Find something older than {{detail|that detail}}.';
    let run = setNote(start(adv), 'detail', 'the blue door');
    run = completeStage(chooseOption(completeStage(run, T0 + MIN), 'observe', T0 + 2 * MIN), T0 + 3 * MIN);
    expect(pathSummary(run)[1].action).toBe('Find something older than the blue door.');
    expect(pathSummary(setNote(run, 'detail', '')).at(1)?.action).toBe('Find something older than that detail.');
  });
});

describe('completeEpisode', () => {
  it('requires a finished run', () => {
    expect(() => completeEpisode(start(), T0)).toThrow(/not finished/);
  });

  it('renders the twist and closing line with the user’s notes', () => {
    let run = setNote(start(), 'detail', 'a door painted the wrong blue');
    run = completeStage(run, T0 + 8 * MIN);
    run = chooseOption(run, 'legend', T0 + 9 * MIN);
    run = setNote(run, 'legend', 'The Lamp Post That Saw Too Much');
    run = completeStage(run, T0 + 20 * MIN);
    run = setNote(run, 'souvenir', 'Leaf, c. this morning');
    run = completeStage(run, T0 + 28 * MIN);
    const ep = completeEpisode(run, T0 + 30 * MIN, '  Best   Tuesday\nin ages. ');
    expect(ep.twist).toContain('As of today, The Lamp Post That Saw Too Much is part of');
    expect(ep.twist).not.toContain('{{');
    expect(ep.closingLine).toBe('Official souvenir: Leaf, c. this morning.');
    expect(ep.notes).toEqual({
      detail: 'a door painted the wrong blue',
      legend: 'The Lamp Post That Saw Too Much',
      souvenir: 'Leaf, c. this morning',
    });
    expect(ep.journal).toBe('Best Tuesday in ages.');
  });

  it('falls back to the template defaults when notes were skipped', () => {
    const { run, now } = playThrough(start(), 'legend', T0);
    const ep = completeEpisode(run, now);
    expect(ep.closingLine).toBe('Official souvenir: one leaf, priceless.');
    expect(ep.twist).toContain('As of today, your legend is part of');
    expect(ep.journal).toBe('');
  });

  it('builds a complete collection entry with the right award', () => {
    let run = pauseRun(start(), T0 + 4 * MIN);
    run = resumeRun(run, T0 + 34 * MIN); // 30 paused minutes must not count
    run = setNote(run, 'report', 'This street keeps its secrets above eye level.');
    const { run: done, now } = playThrough(run, 'observe', T0 + 34 * MIN, 7 * MIN);
    const ep = completeEpisode(done, now + 2 * MIN);
    expect(ep).toMatchObject({
      id: done.id,
      episodeNumber: 4,
      adventureId: 'undercover-tourist',
      source: 'curated',
      title: 'The Undercover Tourist',
      tagline: exemplar.tagline,
      kind: 'detective',
      palette: 'ember',
      motif: 'grid',
      weirdness: 2,
      narrator: 'The Tourist Board (unofficial)',
      minutesEstimate: 30,
      prefs: PREFS,
      startedAt: T0,
      completedAt: now + 2 * MIN,
      // 4 min before the pause + four 7-minute steps (stage, choice, stage, stage) after it.
      elapsedMs: 4 * MIN + 4 * 7 * MIN,
      endingId: 'quiet-detective',
      endingTitle: 'The Quiet Detective',
      closingLine: 'This street keeps its secrets above eye level.',
      posterSeed: hashSeed(done.id, 'undercover-tourist', 'quiet-detective'),
    });
    expect(ep.steps).toEqual(pathSummary(done));
    expect(ep.award.points).toEqual({ curiosity: 4, creativity: 0, boldness: 1, connection: 0 });
    expect(ep.award.lines.map((l) => `${l.source}:${l.trait}:${l.points}:${l.label}`)).toEqual([
      'episode:curiosity:2:Completed the episode',
      'episode:boldness:1:Completed the episode',
      'choice:curiosity:1:Chose: Follow the details',
      'ending:curiosity:1:Ending: The Quiet Detective',
    ]);
    expect(completeEpisode(done, now + 2 * MIN)).toEqual(ep);
  });

  it('omits the narrator when the adventure has none', () => {
    const adv: Adventure = structuredClone(exemplar);
    delete adv.narrator;
    const { run, now } = playThrough(start(adv), 'observe', T0);
    expect('narrator' in completeEpisode(run, now)).toBe(false);
  });

  it('caps very long journal entries', () => {
    const { run, now } = playThrough(start(), 'observe', T0);
    const journal = completeEpisode(run, now, 'word '.repeat(200)).journal;
    expect(Array.from(journal).length).toBeLessThanOrEqual(280);
    expect(journal.endsWith('…')).toBe(true);
  });
});
