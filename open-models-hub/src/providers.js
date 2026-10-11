// Every provider speaks the OpenAI-compatible /chat/completions protocol, so one adapter covers
// hosted aggregators (OpenRouter, Together, ...) and local servers (Ollama, vLLM, LM Studio).

export function providerDefs(env = process.env) {
  return [
    { id: 'openrouter', name: 'OpenRouter', kind: 'cloud', base: 'https://openrouter.ai/api/v1', key: env.OPENROUTER_API_KEY, keyUrl: 'https://openrouter.ai/keys', headers: { 'X-Title': 'OpenModels Hub' } },
    { id: 'together', name: 'Together AI', kind: 'cloud', base: 'https://api.together.xyz/v1', key: env.TOGETHER_API_KEY, keyUrl: 'https://api.together.ai/settings/api-keys' },
    { id: 'deepinfra', name: 'DeepInfra', kind: 'cloud', base: 'https://api.deepinfra.com/v1/openai', key: env.DEEPINFRA_API_KEY, keyUrl: 'https://deepinfra.com/dash/api_keys' },
    { id: 'groq', name: 'Groq', kind: 'cloud', base: 'https://api.groq.com/openai/v1', key: env.GROQ_API_KEY, keyUrl: 'https://console.groq.com/keys' },
    { id: 'fireworks', name: 'Fireworks', kind: 'cloud', base: 'https://api.fireworks.ai/inference/v1', key: env.FIREWORKS_API_KEY, keyUrl: 'https://fireworks.ai/account/api-keys' },
    { id: 'huggingface', name: 'Hugging Face', kind: 'cloud', base: 'https://router.huggingface.co/v1', key: env.HF_TOKEN, keyUrl: 'https://huggingface.co/settings/tokens' },
    { id: 'ollama', name: 'Ollama (local)', kind: 'local', base: env.OLLAMA_BASE_URL || 'http://localhost:11434/v1', keyless: true },
    ...(env.CUSTOM_BASE_URL ? [{ id: 'custom', name: env.CUSTOM_NAME || 'Custom', kind: 'local', base: env.CUSTOM_BASE_URL, key: env.CUSTOM_API_KEY, keyless: true }] : [])
  ].map(p => ({ ...p, base: p.base.replace(/\/+$/, ''), hasKey: Boolean(p.key) }));
}

export class ProviderError extends Error {
  constructor(message, { status = 502, code = 'provider_error' } = {}) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const authHeaders = (provider, apiKey) => ({
  'content-type': 'application/json',
  ...(provider.headers || {}),
  ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {})
});

async function upstreamError(res, provider) {
  let detail = '';
  try {
    const text = (await res.text()).slice(0, 2000);
    try { const j = JSON.parse(text); detail = j.error?.message || j.message || (typeof j.error === 'string' ? j.error : ''); } catch { detail = text; }
  } catch {}
  detail = String(detail || '').replace(/\s+/g, ' ').slice(0, 300);
  if (res.status === 401 || res.status === 403) return new ProviderError(`${provider.name} rejected the API key${detail ? ` (${detail})` : ''}`, { status: 401, code: 'provider_auth' });
  if (res.status === 402) return new ProviderError(`${provider.name}: insufficient credits`, { status: 402, code: 'provider_credits' });
  if (res.status === 429) return new ProviderError(`${provider.name} rate limit reached, try again shortly`, { status: 429, code: 'provider_rate_limit' });
  if (res.status === 404) return new ProviderError(`${provider.name}: model not available${detail ? ` (${detail})` : ''}`, { status: 404, code: 'provider_model' });
  return new ProviderError(`${provider.name} error ${res.status}${detail ? `: ${detail}` : ''}`, { status: 502 });
}

export async function listProviderModels(provider, { fetchImpl = fetch, timeoutMs = 10000 } = {}) {
  const res = await fetchImpl(`${provider.base}/models`, { headers: authHeaders(provider, provider.key), signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw await upstreamError(res, provider);
  const body = await res.json();
  const rows = Array.isArray(body) ? body : body.data || body.models || [];
  const NON_CHAT = /embed|whisper|tts|rerank|moderation|flux|stable-diffusion|sdxl|dall|image-gen|speech|transcrib/i;
  return rows
    .filter(r => r && typeof (r.id || r.name) === 'string')
    .filter(r => !r.type || ['chat', 'language', 'text', 'llm'].includes(String(r.type).toLowerCase()))
    .map(r => ({ id: r.id || r.name, context: r.context_length || r.context_window || null }))
    .filter(r => !NON_CHAT.test(r.id));
}

// Opens the upstream request first so HTTP-level failures (bad key, unknown model) can still be
// reported with a proper status code, then returns an async generator of normalized events.
export async function openChat({ provider, apiKey, modelId, messages, params = {}, signal, fetchImpl = fetch }) {
  const body = { model: modelId, messages, stream: true, stream_options: { include_usage: true } };
  for (const k of ['temperature', 'top_p', 'max_tokens']) if (params[k] !== undefined) body[k] = params[k];
  let res;
  try {
    res = await fetchImpl(`${provider.base}/chat/completions`, { method: 'POST', headers: authHeaders(provider, apiKey), body: JSON.stringify(body), signal });
  } catch (e) {
    if (signal?.aborted) throw e;
    throw new ProviderError(`Could not reach ${provider.name}${provider.kind === 'local' ? ' – is the server running?' : ''}`, { status: 502, code: 'provider_unreachable' });
  }
  if (!res.ok) throw await upstreamError(res, provider);
  if (!res.body) throw new ProviderError(`${provider.name} returned an empty response`);
  return parseStream(res.body);
}

export async function* parseStream(stream) {
  const decoder = new TextDecoder();
  let buffer = '';
  const handle = function* (line) {
    if (!line.startsWith('data:')) return; // SSE comments / keep-alives (": PROCESSING")
    const payload = line.slice(5).trim();
    if (!payload || payload === '[DONE]') return;
    let json;
    try { json = JSON.parse(payload); } catch { return; }
    if (json.error) { yield { type: 'error', message: String(json.error.message || json.error).slice(0, 300) }; return; }
    const choice = json.choices?.[0];
    const delta = choice?.delta || {};
    const reasoning = delta.reasoning ?? delta.reasoning_content;
    if (typeof reasoning === 'string' && reasoning) yield { type: 'reasoning', text: reasoning };
    if (typeof delta.content === 'string' && delta.content) yield { type: 'delta', text: delta.content };
    if (json.usage) yield { type: 'usage', usage: { prompt: json.usage.prompt_tokens ?? null, completion: json.usage.completion_tokens ?? null } };
    if (choice?.finish_reason) yield { type: 'finish', reason: choice.finish_reason };
  };
  for await (const chunk of stream) {
    buffer += decoder.decode(chunk, { stream: true });
    let nl;
    while ((nl = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, nl).replace(/\r$/, '');
      buffer = buffer.slice(nl + 1);
      yield* handle(line);
    }
  }
  if (buffer.trim()) yield* handle(buffer.trim());
}
