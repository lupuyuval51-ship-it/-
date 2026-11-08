import { describe, expect, it } from 'vitest';
import type { Backend, StreamHooks, StreamRequest, StreamResult } from '../server/backend.ts';
import { evaluateDraft, extractStreamingTitle, generateEpisode, type GenerateEvent } from '../server/director.ts';
import { buildUserBrief, SYSTEM_PROMPT } from '../server/prompt.ts';
import { StatusTracker } from '../server/status.ts';
import { screenAdventure } from '../server/safety.ts';
import { adventureToAiEpisode, aiEpisodeToAdventure, type AiEpisode } from '../shared/aiEpisode.ts';
import { validateAdventure } from '../shared/validate.ts';
import exemplar from '../src/content/adventures/undercover-tourist.ts';
import type { Prefs } from '../shared/types.ts';
import { mockAiEpisode } from './fixtures/aiEpisode.ts';
import Anthropic from '@anthropic-ai/sdk';

const prefs: Prefs = { minutes: 30, budget: 0, setting: 'outside', company: 'solo', mood: 'curious', weirdness: 2 };

function fakeBackend(drafts: Array<string | (() => never) | { stopReason: string }>): Backend & { calls: StreamRequest[] } {
  const calls: StreamRequest[] = [];
  let i = 0;
  return {
    provider: 'anthropic',
    model: 'claude-opus-5-5',
    calls,
    async stream(req: StreamRequest, hooks: StreamHooks): Promise<StreamResult> {
      calls.push(req);
      const next = drafts[Math.min(i++, drafts.length - 1)];
      if (typeof next === 'function') return next();
      if (typeof next === 'object') return { text: '', stopReason: next.stopReason, model: 'claude-opus-5-5' };
      hooks.onThinking?.();
      let snap = '';
      for (let k = 0; k < next.length; k += 300) {
        const d = next.slice(k, k + 300);
        snap += d;
        hooks.onText?.(d, snap);
      }
      return { text: next, stopReason: 'end_turn', model: 'claude-opus-5-5' };
    },
    async verify() {},
  };
}

async function run(backend: Backend, input = { prefs }) {
  const events: GenerateEvent[] = [];
  const status = new StatusTracker(backend, backend.model);
  const result = await generateEpisode(input, { backend, effort: 'medium', status, log: () => {} }, new AbortController().signal, (e) => events.push(e));
  return { result, events, status: status.snapshot() };
}

describe('AI episode conversion', () => {
  it('round-trips the exemplar through the AI shape and validates', () => {
    const ai = adventureToAiEpisode(exemplar)!;
    const { adventure } = aiEpisodeToAdventure(ai, prefs);
    const r = validateAdventure(adventure);
    expect(r.errors).toEqual([]);
    expect(adventure.source).toBe('ai');
    expect(adventure.settings).toEqual(['outside']);
    expect(adventure.endings).toHaveLength(2);
    // tokens were re-keyed and survive conversion
    expect(adventure.endings[0].closingLine).toContain('{{note3|');
  });

  it('rescales small time overshoots but leaves large ones to fail validation', () => {
    const ai = mockAiEpisode(30);
    ai.stage1.minutes += 10; // 25 → 35 min (+17% over 30)
    const small = aiEpisodeToAdventure(ai, prefs);
    expect(small.fixes.join()).toMatch(/scaled/);
    expect(small.adventure.minutes).toBeLessThanOrEqual(30);
    const big = mockAiEpisode(30);
    big.stage1.minutes = 90;
    const r = evaluateDraft(JSON.stringify(big), { prefs });
    expect(r.ok).toBe(false);
  });

  it('strips note tokens that are not available on the path', () => {
    const ai = mockAiEpisode(30);
    ai.stage1.narrative = 'Remember {{note3|the future}}?';
    const { adventure, fixes } = aiEpisodeToAdventure(ai, prefs);
    expect(adventure.nodes[0].narrative).toBe('Remember the future?');
    expect(fixes.length).toBeGreaterThan(0);
  });
});

describe('evaluateDraft', () => {
  it('rejects non-JSON, bad shapes, budget violations and unsafe content', () => {
    expect(evaluateDraft('not json', { prefs }).ok).toBe(false);
    expect(evaluateDraft('{"title":1}', { prefs }).ok).toBe(false);
    const pricey = mockAiEpisode(30);
    pricey.costMax = 25;
    const r1 = evaluateDraft(JSON.stringify(pricey), { prefs });
    expect(!r1.ok && r1.problems.join()).toMatch(/budget/);
    const unsafe = mockAiEpisode(30);
    unsafe.pathA.stage2.action = 'Climb onto the roof of the nearest building and wave.';
    const r2 = evaluateDraft(JSON.stringify(unsafe), { prefs });
    expect(!r2.ok && r2.problems.join()).toMatch(/Safety/);
  });

  it('accepts a good draft', () => {
    const r = evaluateDraft(JSON.stringify(mockAiEpisode(30)), { prefs });
    expect(r.ok).toBe(true);
  });
});

describe('generateEpisode', () => {
  it('streams phases, the title, and a validated episode', async () => {
    const backend = fakeBackend([JSON.stringify(mockAiEpisode(30))]);
    const { result, events, status } = await run(backend);
    expect(result?.title).toBe('The Borrowed Postcard');
    const types = events.map((e) => (e.type === 'phase' ? `phase:${e.phase}` : e.type));
    expect(types[0]).toBe('phase:plotting');
    expect(types).toContain('phase:writing');
    expect(types).toContain('title');
    expect(types.at(-1)).toBe('episode');
    expect(status.state).toBe('online');
    expect(backend.calls[0].system).toBe(SYSTEM_PROMPT);
    expect(backend.calls[0].user).toContain('Available time: 30 minutes');
  });

  it('repairs an invalid first draft once', async () => {
    const bad = mockAiEpisode(30);
    bad.stage1.minutes = 80;
    const backend = fakeBackend([JSON.stringify(bad), JSON.stringify(mockAiEpisode(30))]);
    const { result, events } = await run(backend);
    expect(result).not.toBeNull();
    expect(events.some((e) => e.type === 'phase' && e.phase === 'repairing')).toBe(true);
    const done = events.find((e) => e.type === 'episode');
    expect(done && done.type === 'episode' && done.repaired).toBe(true);
    expect(backend.calls[1].user).toContain('broke these rules');
  });

  it('gives up after a failed repair', async () => {
    const bad = mockAiEpisode(30);
    bad.costMax = 50;
    const { result, events, status } = await run(fakeBackend([JSON.stringify(bad)]));
    expect(result).toBeNull();
    const err = events.at(-1);
    expect(err?.type === 'error' && err.code).toBe('invalid_output');
    expect(status.state).toBe('degraded');
  });

  it('does not repair refusals', async () => {
    const backend = fakeBackend([{ stopReason: 'refusal' }]);
    const { result, events } = await run(backend);
    expect(result).toBeNull();
    expect(backend.calls).toHaveLength(1);
    const err = events.at(-1);
    expect(err?.type === 'error' && err.code).toBe('refused');
  });

  it('classifies provider connection errors and marks status unreachable', async () => {
    const backend = fakeBackend([
      () => {
        throw new Anthropic.APIConnectionError({ message: 'connect ECONNREFUSED' });
      },
    ]);
    const { result, events, status } = await run(backend);
    expect(result).toBeNull();
    const err = events.at(-1);
    expect(err?.type === 'error' && err.code).toBe('network');
    expect(status.state).toBe('unreachable');
  });
});

describe('prompt', () => {
  it('builds a brief with hard numbers, time of day and avoid lists', () => {
    const brief = buildUserBrief({ prefs: { ...prefs, company: 'group', budget: 30 }, localHour: 20, detail: 'near the old port', avoidTitles: ['The Sound Detective'], avoidKinds: ['detective'] });
    expect(brief).toMatch(/at most 30/);
    expect(brief).toMatch(/costMax must be at most 30/);
    expect(brief).toMatch(/evening/);
    expect(brief).toMatch(/well-lit/);
    expect(brief).toMatch(/near the old port/);
    expect(brief).toMatch(/Sound Detective/);
    expect(brief).toMatch(/different kind/);
  });

  it('keeps the system prompt free of per-request data (cacheable)', () => {
    expect(SYSTEM_PROMPT).not.toMatch(/\d{4}-\d{2}-\d{2}T/);
    expect(SYSTEM_PROMPT.length).toBeGreaterThan(4000);
  });
});

describe('safety screen', () => {
  it('passes the exemplar and flags clear violations', () => {
    expect(screenAdventure(exemplar)).toEqual([]);
    const bad = structuredClone(exemplar);
    bad.nodes[1].action = 'Secretly photograph strangers at the bus stop.';
    expect(screenAdventure(bad).length).toBeGreaterThan(0);
  });
});

describe('streaming title', () => {
  it('extracts the title as soon as it is complete', () => {
    expect(extractStreamingTitle('{"title":"The Gl')).toBeNull();
    expect(extractStreamingTitle('{"title":"The \\"Glass\\" Hour","tag')).toBe('The "Glass" Hour');
  });
});

// type-only use to keep the import (AiEpisode) meaningful for readers
export type _AiEpisode = AiEpisode;

describe('safety screen precision', () => {
  it('flags instructions, not mentions', async () => {
    const { screenAdventure } = await import('../server/safety.ts');
    const base = structuredClone(exemplar);
    base.endings[0].twist = 'Plot twist: satellites have photographed every rooftop on Earth, but not your note.';
    expect(screenAdventure(base)).toEqual([]);
    base.nodes[1].action = 'Go up onto the roof of your building and wave at the city.';
    expect(screenAdventure(base).join()).toMatch(/roof/);
  });
});
