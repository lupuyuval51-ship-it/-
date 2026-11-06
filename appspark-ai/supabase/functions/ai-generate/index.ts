// AppSpark AI – server-side AI gateway.
//
// Deploy:  supabase functions deploy ai-generate
// Secrets: supabase secrets set AI_PROVIDER=anthropic AI_API_KEY=... AI_MODEL=... AI_DAILY_LIMIT=40
//
// The client never talks to an AI provider directly. This function:
//   1. verifies the caller is a signed-in user (JWT on Authorization),
//   2. enforces a per-user daily quota (ai_usage table via increment_ai_usage),
//   3. calls the configured provider (anthropic | openai | gemini),
//   4. validates the JSON the model returns before handing it to the client.

import { withSupabase } from 'npm:@supabase/server';

type Provider = 'anthropic' | 'openai' | 'gemini';

interface ProviderConfig {
  provider: Provider;
  apiKey: string;
  model: string;
}

const DEFAULT_MODELS: Record<Provider, string> = {
  anthropic: 'claude-sonnet-5-5',
  openai: 'gpt-5.1',
  gemini: 'gemini-2.5-pro',
};

function readConfig(): ProviderConfig | null {
  const provider = (Deno.env.get('AI_PROVIDER') ?? '').toLowerCase() as Provider;
  const apiKey = Deno.env.get('AI_API_KEY') ?? '';
  if (!provider || !apiKey || !(provider in DEFAULT_MODELS)) return null;
  return { provider, apiKey, model: Deno.env.get('AI_MODEL') || DEFAULT_MODELS[provider] };
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const CATEGORY_SLUGS = ['ai', 'productivity', 'business', 'health', 'education', 'finance', 'social', 'entertainment', 'games', 'devtools', 'lifestyle', 'creativity', 'ecommerce'];

const IDEA_SCHEMA_DESCRIPTION = `Return ONLY a JSON object: {"ideas": Idea[]} with 3 to 5 ideas. Each Idea has exactly this shape (every text field is an object with "he" (Hebrew) and "en" (English) strings; lists are objects with "he" and "en" string arrays of equal length):
{
  "id": string (lowercase slug with dashes, unique),
  "name": {"he","en"}, "tagline": {"he","en"} (one sentence),
  "category": one of ${CATEGORY_SLUGS.join('|')},
  "secondaryCategories": string[] (0-2 of the same slugs),
  "difficulty": "beginner"|"intermediate"|"advanced",
  "effort": {"weeksMin": number, "weeksMax": number} (one developer; beginner 1-3, intermediate 3-8, advanced 8-20),
  "budget": "free"|"low"|"medium"|"high" (money needed to run the MVP, not revenue),
  "businessModel": "free"|"freemium"|"subscription"|"one-time"|"ads"|"marketplace"|"b2b"|"open-source",
  "platforms": ("ios"|"android"|"web"|"cross-platform")[],
  "audience": ("consumers"|"developers"|"businesses"|"students"|"creators"|"kids"|"parents"|"professionals"|"gamers"|"teams")[],
  "tags": string[] (5-8 lowercase english keywords),
  "identity": {"hue": 0-360, "glyph": 1-2 latin letters, "pattern": "grid"|"wave"|"dots"|"diagonal"|"ring"|"none"},
  "flags": {"beginnerFriendly": boolean, "profitPotential": "low"|"medium"|"high", "experimental": boolean, "trending": false, "featuredWeight": 1},
  "spec": {
    "overview": {"he","en"} (120-600 chars), "problem": {"he","en"}, "solution": {"he","en"}, "usp": {"he","en"},
    "targetUsers": {"he": string[], "en": string[]} (2-4),
    "coreFeatures": {"he": string[], "en": string[]} (4-7),
    "screens": [{"name": {"he","en"}, "description": {"he","en"}}] (4-7),
    "userJourney": {"he": string[], "en": string[]} (4-6 steps),
    "uxDirection": {"he","en"}, "architecture": {"he","en"},
    "stack": string[] (real technology names in English),
    "database": {"he": string[], "en": string[]} (3-6 entities),
    "auth": {"he","en"},
    "monetization": {"he": string[], "en": string[]} (1-4),
    "mvpMilestones": {"he": string[], "en": string[]} (3-5),
    "risks": {"he": string[], "en": string[]} (2-4),
    "expansion": {"he": string[], "en": string[]} (2-4)
  }
}
Rules: concrete differentiator per idea (a mechanism, not adjectives); no invented market statistics, user counts or guaranteed earnings; natural native-quality Hebrew; realistic estimates; no medical claims.`;

function buildIdeasPrompt(input: Record<string, unknown>, locale: string): { system: string; user: string } {
  const system = `You are a world-class startup product strategist and bilingual (Hebrew/English) product writer. You generate original, specific app concepts for solo developers and small teams. ${IDEA_SCHEMA_DESCRIPTION}`;
  const user = `Generate 3-5 distinct app concepts. The user's brief (may be Hebrew or English): """${String(input.brief ?? '').slice(0, 1500)}"""
Preferences: category=${input.category ?? 'any'}, audience=${input.audience ?? 'any'}, complexity=${input.complexity}, platform=${input.platform}, monetization=${input.monetization ?? 'any'}, budget=${input.budget}, interests="${String(input.interests ?? '').slice(0, 300)}", originality=${input.originality}.
Primary UI locale of the requester: ${locale}. Both languages are required in every field. Respond with JSON only.`;
  return { system, user };
}

function buildEnhancePrompt(content: string, ideaName: string, locale: string): { system: string; user: string } {
  const system = `You are a principal engineer who writes development briefs for AI coding assistants. Improve the brief you are given: remove ambiguity, add missing acceptance criteria, tighten wording, keep every section heading and the overall structure, keep the language of the brief (${locale === 'he' ? 'Hebrew' : 'English'}). Never add market statistics or promises. Return ONLY the improved Markdown brief, no preamble.`;
  const user = `Product: ${ideaName}\n\n${content.slice(0, 40000)}`;
  return { system, user };
}

async function callProvider(config: ProviderConfig, system: string, user: string, jsonMode: boolean): Promise<string> {
  if (config.provider === 'anthropic') {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': config.apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: config.model, max_tokens: 16000, system, messages: [{ role: 'user', content: user }] }),
    });
    if (!res.ok) throw new Error(`anthropic ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return (data.content ?? []).map((c: { text?: string }) => c.text ?? '').join('');
  }
  if (config.provider === 'openai') {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
      }),
    });
    if (!res.ok) throw new Error(`openai ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? '';
  }
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: jsonMode ? { responseMimeType: 'application/json' } : {},
    }),
  });
  if (!res.ok) throw new Error(`gemini ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return (data.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? '').join('');
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : trimmed;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('no json object in model output');
  return JSON.parse(candidate.slice(start, end + 1));
}

function isLocalized(v: unknown): boolean {
  return !!v && typeof v === 'object' && typeof (v as { he?: unknown }).he === 'string' && typeof (v as { en?: unknown }).en === 'string';
}
function isList(v: unknown): boolean {
  return !!v && typeof v === 'object' && Array.isArray((v as { he?: unknown }).he) && Array.isArray((v as { en?: unknown }).en);
}

function validIdea(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object') return false;
  const idea = raw as Record<string, unknown>;
  const spec = idea.spec as Record<string, unknown> | undefined;
  if (typeof idea.id !== 'string' || !isLocalized(idea.name) || !isLocalized(idea.tagline) || !CATEGORY_SLUGS.includes(String(idea.category))) return false;
  if (!spec) return false;
  const localized = ['overview', 'problem', 'solution', 'usp', 'uxDirection', 'architecture', 'auth'];
  const lists = ['targetUsers', 'coreFeatures', 'userJourney', 'database', 'monetization', 'mvpMilestones', 'risks', 'expansion'];
  return localized.every((k) => isLocalized(spec[k])) && lists.every((k) => isList(spec[k])) && Array.isArray(spec.screens) && Array.isArray(spec.stack);
}

function sanitizeIdea(raw: Record<string, unknown>, index: number): Record<string, unknown> {
  const id = `ai-${Date.now().toString(36)}-${index}-${String(raw.id).toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40) || 'idea'}`;
  const identity = (raw.identity as Record<string, unknown>) ?? {};
  const flags = (raw.flags as Record<string, unknown>) ?? {};
  return {
    ...raw,
    id,
    secondaryCategories: Array.isArray(raw.secondaryCategories) ? (raw.secondaryCategories as string[]).filter((c) => CATEGORY_SLUGS.includes(c)).slice(0, 2) : [],
    identity: {
      hue: typeof identity.hue === 'number' ? Math.max(0, Math.min(360, identity.hue)) : (index * 67) % 360,
      glyph: typeof identity.glyph === 'string' ? identity.glyph.slice(0, 2) : 'AI',
      pattern: ['grid', 'wave', 'dots', 'diagonal', 'ring', 'none'].includes(String(identity.pattern)) ? identity.pattern : 'none',
    },
    flags: {
      beginnerFriendly: Boolean(flags.beginnerFriendly),
      profitPotential: ['low', 'medium', 'high'].includes(String(flags.profitPotential)) ? flags.profitPotential : 'medium',
      experimental: Boolean(flags.experimental),
      trending: false,
      featuredWeight: 1,
    },
    tags: Array.isArray(raw.tags) ? (raw.tags as unknown[]).map((t) => String(t).toLowerCase()).slice(0, 8) : [],
  };
}

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);
    const config = readConfig();
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json({ error: 'invalid json' }, 400);
    }
    const kind = String(body.kind ?? '');

    if (kind === 'health') {
      return json({ ok: true, enabled: Boolean(config), provider: config?.provider, model: config?.model });
    }
    if (!config) return json({ error: 'AI provider not configured', code: 'disabled' }, 503);

    const userId = ctx.userClaims?.id as string | undefined;
    if (!userId) return json({ error: 'unauthorized' }, 401);

    const limit = Number(Deno.env.get('AI_DAILY_LIMIT') ?? 40);
    const { data: allowed, error: quotaError } = await ctx.supabaseAdmin.rpc('increment_ai_usage', { p_user_id: userId, p_limit: limit });
    if (quotaError) {
      console.error('quota check failed', quotaError);
      return json({ error: 'quota check failed' }, 500);
    }
    if (allowed === false) return json({ error: 'daily quota exceeded', code: 'quota' }, 429);

    const locale = body.locale === 'en' ? 'en' : 'he';

    try {
      if (kind === 'ideas') {
        const input = (body.input ?? {}) as Record<string, unknown>;
        const { system, user } = buildIdeasPrompt(input, locale);
        let ideas: Record<string, unknown>[] = [];
        for (let attempt = 0; attempt < 2 && ideas.length === 0; attempt += 1) {
          const text = await callProvider(config, system, user, true);
          const parsed = extractJson(text) as { ideas?: unknown[] };
          ideas = (parsed.ideas ?? []).filter(validIdea).map((raw, i) => sanitizeIdea(raw as Record<string, unknown>, i));
        }
        if (!ideas.length) return json({ error: 'model returned no valid ideas', code: 'invalid' }, 502);
        return json({ ideas: ideas.slice(0, 5), provider: config.provider, model: config.model });
      }
      if (kind === 'enhance-prompt') {
        const content = String(body.content ?? '');
        if (!content.trim()) return json({ error: 'empty content' }, 400);
        const { system, user } = buildEnhancePrompt(content, String(body.ideaName ?? ''), locale);
        const text = await callProvider(config, system, user, false);
        if (!text.trim()) return json({ error: 'empty model output' }, 502);
        return json({ content: text.trim(), provider: config.provider, model: config.model });
      }
      return json({ error: 'unknown kind' }, 400);
    } catch (error) {
      console.error('ai-generate failed', error);
      return json({ error: 'generation failed' }, 502);
    }
  }),
};
