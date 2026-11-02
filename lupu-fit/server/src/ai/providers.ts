import type { AiProvider } from '../core/types.ts';

type Env = Record<string, string | undefined>;
/** Google Gemma 4 first (documented IDs on the Gemini API), Gemini as fallback when Gemma is rate limited/unavailable. */
const DEFAULT_GEMINI_MODELS = ['gemma-4-31b-it', 'gemma-4-26b-a4b-it', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'];
/** Gemma's docs do not list JSON mode, so for gemma-* the responseMimeType hint is dropped (the prompt + server validation enforce JSON). */
function forModel(model: string, body: unknown): unknown {
  if (!/^gemma/i.test(model) || typeof body !== 'object' || body === null) return body;
  const b = body as { generationConfig?: Record<string, unknown> };
  if (!b.generationConfig || !('responseMimeType' in b.generationConfig)) return body;
  const { responseMimeType: _drop, ...rest } = b.generationConfig;
  return { ...b, generationConfig: rest };
}
/** GEMINI_MODELS="model-a,model-b" (comma separated, first = preferred) overrides the default chain; only [a-z0-9._-] names are accepted. */
export function geminiModelsFromEnv(raw: string | undefined): string[] {
  const list = (raw ?? '').split(',').map((x) => x.trim()).filter((x) => /^[a-z0-9][a-z0-9._-]{1,60}$/i.test(x));
  return list.length > 0 ? list : DEFAULT_GEMINI_MODELS;
}

/** Gemini free tier with automatic fallback to a lighter model when one is rate limited (cooldown 60 s). */
export class GeminiProvider implements AiProvider {
  readonly name = 'gemini';
  private cooldown = new Map<string, number>();
  constructor(private readonly key: string, private readonly f: typeof fetch = fetch, private readonly models: string[] = DEFAULT_GEMINI_MODELS) {}
  private async call(model: string, body: unknown): Promise<string> {
    const r = await this.f(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': this.key }, body: JSON.stringify(forModel(model, body)) });
    if (r.status === 429 || r.status === 503) { this.cooldown.set(model, Date.now() + 60_000); throw new Error(`gemini_busy_${r.status}`); }
    if (!r.ok) throw new Error(`gemini_http_${r.status}`);
    const j = (await r.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    return j.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
  }
  private async run(body: unknown): Promise<string> {
    let last: unknown;
    for (const m of this.models) {
      if ((this.cooldown.get(m) ?? 0) > Date.now()) continue;
      try { return await this.call(m, body); } catch (e) { last = e; }
    }
    throw last instanceof Error ? last : new Error('gemini_unavailable');
  }
  complete(i: Parameters<AiProvider['complete']>[0]): Promise<string> {
    return this.run({ systemInstruction: { parts: [{ text: i.system }] }, contents: i.messages.map((m) => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] })), ...(i.json || i.maxTokens ? { generationConfig: { ...(i.json ? { responseMimeType: 'application/json' } : {}), ...(i.maxTokens ? { maxOutputTokens: i.maxTokens } : {}) } } : {}) });
  }
  describeImage(i: { system: string; prompt: string; jpegBase64: string }): Promise<string> {
    return this.run({ systemInstruction: { parts: [{ text: i.system }] }, contents: [{ role: 'user', parts: [{ text: i.prompt }, { inlineData: { mimeType: 'image/jpeg', data: i.jpegBase64 } }] }] });
  }
}

export class ClaudeProvider implements AiProvider {
  readonly name = 'claude';
  constructor(private readonly key: string, private readonly model = process.env['ANTHROPIC_MODEL'] ?? 'claude-haiku-4-5', private readonly f: typeof fetch = fetch) {}
  private async call(body: unknown): Promise<string> {
    const r = await this.f('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': this.key, 'anthropic-version': '2023-06-01' }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(`claude_http_${r.status}`);
    const j = (await r.json()) as { content?: { type: string; text?: string }[] };
    return (j.content ?? []).filter((c) => c.type === 'text').map((c) => c.text ?? '').join('');
  }
  complete(i: Parameters<AiProvider['complete']>[0]): Promise<string> {
    return this.call({ model: this.model, max_tokens: i.maxTokens ?? 700, system: i.system, messages: i.messages });
  }
  describeImage(i: { system: string; prompt: string; jpegBase64: string }): Promise<string> {
    return this.call({ model: this.model, max_tokens: 700, system: i.system, messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: i.jpegBase64 } }, { type: 'text', text: i.prompt }] }] });
  }
}

/** Keys live only in server environment variables. Claude is preferred (private); Gemini free tier is the fallback. */
export function providersFromEnv(env: Env): AiProvider | undefined {
  if (env['ANTHROPIC_API_KEY']) return new ClaudeProvider(env['ANTHROPIC_API_KEY']);
  if (env['GEMINI_API_KEY']) return new GeminiProvider(env['GEMINI_API_KEY'], fetch, geminiModelsFromEnv(env['GEMINI_MODELS']));
  return undefined;
}
