/**
 * The shared AI Director status: what one visitor's generation, a forced
 * refresh, or a hiccup of the Models API may (and may not) change for everyone.
 */
import Anthropic from '@anthropic-ai/sdk';
import { describe, expect, it } from 'vitest';
import type { Backend, FailureKind } from '../server/backend.ts';
import { ERROR_TTL_MS, FORCED_REFRESH_MIN_AGE_MS, StatusTracker } from '../server/status.ts';

const apiError = (status: number, type: string) =>
  Anthropic.APIError.generate(status, { type: 'error', error: { type, message: type } }, undefined, new Headers());

/** A backend whose Models API check answers from a queue (the last answer repeats). */
function checkingBackend(answers: Array<'ok' | Error> = ['ok']): Backend & { checks: number } {
  const backend = {
    provider: 'anthropic' as const,
    model: 'claude-opus-5-5',
    checks: 0,
    async stream(): Promise<never> {
      throw new Error('not used');
    },
    async verify() {
      const answer = answers[Math.min(backend.checks, answers.length - 1)];
      backend.checks++;
      if (answer !== 'ok') throw answer;
    },
  };
  return backend;
}

function tracker(answers?: Array<'ok' | Error>) {
  const clock = { t: 1_000_000 };
  const backend = checkingBackend(answers);
  const logs: string[] = [];
  const status = new StatusTracker(backend, backend.model, () => clock.t, { log: (m) => logs.push(m) });
  return { status, backend, clock, logs };
}

describe('a provider failure while writing (#50)', () => {
  it('is not undone by a forced refresh: busy stays busy for the error window', async () => {
    const { status, backend, clock } = tracker();
    expect((await status.refresh(true)).state).toBe('online');
    status.recordFailure('overloaded');
    expect(status.snapshot()).toMatchObject({ state: 'rate_limited', label: 'Busy', canGenerate: false });

    // The client's refresh right after the failed envelope: cached, no provider call.
    expect((await status.refresh(true)).state).toBe('rate_limited');
    expect(backend.checks).toBe(1);

    // Later in the window a forced refresh does re-check — the Models API is fine — but the hold remains.
    clock.t += FORCED_REFRESH_MIN_AGE_MS + 1_000;
    expect(await status.refresh(true)).toMatchObject({ state: 'rate_limited', canGenerate: false });
    expect(backend.checks).toBe(2);

    clock.t += ERROR_TTL_MS;
    expect(await status.refresh()).toMatchObject({ state: 'online', canGenerate: true });
  });

  it.each<[FailureKind, string, boolean]>([
    ['rate_limited', 'rate_limited', false],
    ['overloaded', 'rate_limited', false],
    ['network', 'unreachable', false],
    ['timeout', 'unreachable', false],
    ['server', 'degraded', true],
    ['unknown', 'degraded', true],
  ])('%s is held as %s (canGenerate %s) through a passing check', async (kind, state, canGenerate) => {
    const { status, clock } = tracker();
    await status.refresh(true);
    status.recordFailure(kind);
    clock.t += FORCED_REFRESH_MIN_AGE_MS + 1;
    expect(await status.refresh(true)).toMatchObject({ state, canGenerate });
    clock.t += ERROR_TTL_MS;
    expect((await status.refresh()).state).toBe('online');
  });

  it('a stalled stream says so instead of a generic message', async () => {
    const { status } = tracker();
    await status.refresh(true);
    status.recordFailure('timeout');
    expect(status.snapshot().detail).toMatch(/stopped responding while writing/);
  });

  it('a success clears the hold at once', async () => {
    const { status } = tracker();
    await status.refresh(true);
    status.recordFailure('rate_limited');
    status.recordSuccess();
    expect(status.snapshot()).toMatchObject({ state: 'online', canGenerate: true });
  });
});

describe('outcomes about one request (#51)', () => {
  it.each<FailureKind>(['refused', 'invalid_output', 'truncated', 'bad_request', 'aborted'])('%s does not change the shared status', async (kind) => {
    const { status } = tracker();
    await status.refresh(true);
    status.recordFailure(kind);
    expect(status.snapshot()).toMatchObject({ state: 'online', canGenerate: true, lastFailureAt: null });
  });

  it('a 5xx from the Models API reads as unreachable for a short while, without claiming an episode failed', async () => {
    const { status, clock, logs } = tracker([apiError(500, 'api_error'), 'ok']);
    const s = await status.refresh(true);
    expect(s).toMatchObject({ state: 'unreachable', canGenerate: false, lastFailureAt: null });
    expect(s.detail).toMatch(/not answering properly/);
    expect(s.detail).not.toMatch(/fail/i); // nothing was generated, so no episode "failed"
    expect(logs.join('\n')).toMatch(/check failed: server/);
    clock.t += ERROR_TTL_MS + 1;
    expect((await status.refresh()).state).toBe('online');
  });

  it('so does an unknown error from the check', async () => {
    const { status } = tracker([new Error('something odd')]);
    const s = await status.refresh(true);
    expect(s.state).toBe('unreachable');
    expect(s.detail).not.toMatch(/fail/i);
  });
});

describe('forced refreshes (#54)', () => {
  it('re-check the provider at most once per 15 s', async () => {
    const { status, backend, clock } = tracker();
    await status.refresh(true);
    for (let i = 0; i < 50; i++) await status.refresh(true);
    expect(backend.checks).toBe(1);
    clock.t += FORCED_REFRESH_MIN_AGE_MS - 1;
    await status.refresh(true);
    expect(backend.checks).toBe(1);
    clock.t += 2;
    await status.refresh(true);
    expect(backend.checks).toBe(2);
  });

  it('share one check when they overlap', async () => {
    const { status, backend } = tracker();
    await Promise.all(Array.from({ length: 20 }, () => status.refresh(true)));
    expect(backend.checks).toBe(1);
  });

  it('treat a 429 (or 529) from the Models API as transient: generation stays on', async () => {
    const { status, clock } = tracker(['ok', apiError(429, 'rate_limit_error'), apiError(529, 'overloaded_error')]);
    expect((await status.refresh(true)).state).toBe('online');
    clock.t += FORCED_REFRESH_MIN_AGE_MS + 1;
    expect(await status.refresh(true)).toMatchObject({ state: 'online', canGenerate: true });
    clock.t += FORCED_REFRESH_MIN_AGE_MS + 1;
    expect(await status.refresh(true)).toMatchObject({ state: 'online', canGenerate: true });
  });

  it('a 429 on the very first check still lets the AI Director work', async () => {
    const { status } = tracker([apiError(429, 'rate_limit_error')]);
    expect(await status.refresh(true)).toMatchObject({ state: 'online', canGenerate: true });
  });
});

describe('configuration states', () => {
  it('reports a malformed key as misconfigured (#58)', async () => {
    const status = new StatusTracker(null, 'claude-opus-5-5', Date.now, { misconfigured: true, log: () => {} });
    const s = await status.refresh(true);
    expect(s).toMatchObject({ state: 'misconfigured', configured: true, canGenerate: false, label: 'Key invalid' });
  });

  it('keeps not_configured without a key', async () => {
    const s = await new StatusTracker(null, 'claude-opus-5-5').refresh(true);
    expect(s).toMatchObject({ state: 'not_configured', configured: false, canGenerate: false });
  });

  it('a rejected key during generation shows until the next check', async () => {
    const { status } = tracker();
    await status.refresh(true);
    status.recordFailure('auth');
    expect(status.snapshot()).toMatchObject({ state: 'auth_failed', canGenerate: false });
  });
});
