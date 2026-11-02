import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { COACH_WORD_LIMIT, fitsContext, generateLocal, limitWords, MAX_TOKENS } from './generate.ts';
import { failWith, makeMock } from './mockPlugin.ts';
import { LocalAiError } from './types.ts';

const req = { system: 'sys', messages: [{ role: 'user' as const, content: 'hi' }] };
beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

describe('generateLocal', () => {
  it('returns the text, streams with a requestId and caps maxTokens', async () => {
    const ai = makeMock();
    await expect(generateLocal(ai, { ...req, maxTokens: 99999 }, 'coach')).resolves.toBe('local answer');
    expect(ai.calls.generate[0]).toMatchObject({ stream: true, json: false, maxTokens: MAX_TOKENS.coach });
    expect(ai.calls.generate[0]!.requestId).toMatch(/^g/);
  });
  it('enforces the 150-word coach limit but not for translation JSON', async () => {
    const long = Array.from({ length: 400 }, (_, i) => `w${i}`).join(' ');
    const ai = makeMock(); ai.onGenerate = (o, a) => { a.emitToken(o.requestId, 'x'); return Promise.resolve({ text: long, backend: 'cpu', firstTokenMs: 1, truncated: false }); };
    expect((await generateLocal(ai, req, 'coach')).split(/\s+/).length).toBeLessThanOrEqual(COACH_WORD_LIMIT + 1);
    expect((await generateLocal(ai, { ...req, json: true }, 'translate')).split(/\s+/).length).toBe(400);
  });
  it('times out after the 30 s first-token budget, aborts natively and reports "timeout"', async () => {
    const ai = makeMock();
    let rejectGen!: (e: unknown) => void;
    ai.onGenerate = () => new Promise((_, rej) => { rejectGen = rej; });
    ai.abort = () => { ai.calls.abort++; rejectGen(new LocalAiError('aborted')); return Promise.resolve(); };
    const p = generateLocal(ai, req, 'coach'); const assertion = expect(p).rejects.toMatchObject({ code: 'timeout' });
    await vi.advanceTimersByTimeAsync(29_999); expect(ai.calls.abort).toBe(0);
    await vi.advanceTimersByTimeAsync(2); await assertion;
    expect(ai.calls.abort).toBe(1);
  });
  it('a streamed first token cancels the first-token budget', async () => {
    const ai = makeMock(); let resolveGen!: (r: { text: string; backend: string; firstTokenMs: number; truncated: boolean }) => void;
    ai.onGenerate = (o, a) => new Promise((res) => { resolveGen = res; setTimeout(() => a.emitToken(o.requestId, 'a'), 1000); });
    const p = generateLocal(ai, req, 'coach');
    await vi.advanceTimersByTimeAsync(1001); await vi.advanceTimersByTimeAsync(60_000);
    expect(ai.calls.abort).toBe(0);
    resolveGen({ text: 'done', backend: 'cpu', firstTokenMs: 1000, truncated: false });
    await expect(p).resolves.toBe('done');
  });
  it('abort signal stops generation and reports "aborted"', async () => {
    const ai = makeMock(); let rej!: (e: unknown) => void;
    ai.onGenerate = () => new Promise((_, r) => { rej = r; });
    ai.abort = () => { ai.calls.abort++; rej(new LocalAiError('aborted')); return Promise.resolve(); };
    const ac = new AbortController(); const p = generateLocal(ai, req, 'coach', { signal: ac.signal }); const a = expect(p).rejects.toMatchObject({ code: 'aborted' });
    ac.abort(); await a; expect(ai.calls.abort).toBe(1);
    await expect(generateLocal(ai, req, 'coach', { signal: ac.signal })).rejects.toMatchObject({ code: 'aborted' });
  });
  it('maps native failures and empty output to LocalAiError', async () => {
    const ai = makeMock(); ai.onGenerate = failWith('engine_init_failed');
    await expect(generateLocal(ai, req, 'coach')).rejects.toMatchObject({ code: 'engine_init_failed' });
    ai.onGenerate = () => Promise.reject(new Error('boom'));
    await expect(generateLocal(ai, req, 'coach')).rejects.toMatchObject({ code: 'generation_failed' });
    ai.onGenerate = () => Promise.resolve({ text: '  ', backend: 'cpu', firstTokenMs: 0, truncated: false });
    await expect(generateLocal(ai, req, 'coach')).rejects.toMatchObject({ code: 'empty' });
  });
  it('refuses prompts that cannot fit the 4096-token window without touching the plugin', async () => {
    const ai = makeMock(); const big = { system: 'x'.repeat(12_000), messages: [{ role: 'user' as const, content: 'q' }] };
    expect(fitsContext(big, 320)).toBe(false);
    await expect(generateLocal(ai, big, 'coach')).rejects.toMatchObject({ code: 'too_long' });
    expect(ai.calls.generate).toHaveLength(0);
  });
});

describe('limitWords', () => {
  it('keeps short text, cuts at a sentence end when possible', () => {
    expect(limitWords('Short answer.')).toBe('Short answer.');
    const t = `${'one two three. '.repeat(100)}`;
    const out = limitWords(t, 20); expect(out.endsWith('.')).toBe(true); expect(out.split(/\s+/).length).toBeLessThanOrEqual(20);
  });
});
