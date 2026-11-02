import { describe, expect, it } from 'vitest';
import { GeminiProvider, geminiModelsFromEnv } from '../src/ai/providers.ts';

describe('GEMINI_MODELS override', () => {
  it('defaults when unset or invalid, accepts a clean comma list', () => {
    expect(geminiModelsFromEnv(undefined)).toEqual(['gemini-2.5-flash', 'gemini-2.5-flash-lite']);
    expect(geminiModelsFromEnv('bad name!, ../x')).toEqual(['gemini-2.5-flash', 'gemini-2.5-flash-lite']);
    expect(geminiModelsFromEnv(' model-a , model-b ')).toEqual(['model-a', 'model-b']);
  });
  it('tries the configured models in order and falls back on 429', async () => {
    const urls: string[] = [];
    const f = (async (u: string) => { urls.push(u); return u.includes('model-a') ? new Response('', { status: 429 }) : new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'ok' }] } }] }), { status: 200 }); }) as unknown as typeof fetch;
    const p = new GeminiProvider('k', f, ['model-a', 'model-b']);
    expect(await p.complete({ system: 's', messages: [{ role: 'user', content: 'hi' }] })).toBe('ok');
    expect(urls[0]).toContain('/models/model-a:'); expect(urls[1]).toContain('/models/model-b:');
  });
});
