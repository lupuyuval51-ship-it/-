import { LocalAiError, type AiKind, type LocalAi } from './types.ts';

export const FIRST_TOKEN_BUDGET_MS = 30_000;
export const TOTAL_BUDGET_MS = 150_000;
/** Same limit as the cloud coach prompt ("under 150 words"). */
export const COACH_WORD_LIMIT = 150;
/** Hard caps; the plugin clamps again natively. */
export const MAX_TOKENS: Record<AiKind, number> = { coach: 320, translate: 1024 };

export interface LocalRequest { system: string; messages: { role: 'user' | 'assistant'; content: string }[]; maxTokens?: number; json?: boolean }

/** Trim to `limit` words (keeps line breaks of the kept part). Returns the text unchanged when short enough. */
export function limitWords(text: string, limit = COACH_WORD_LIMIT): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= limit) return text.trim();
  const cut = words.slice(0, limit).join(' ');
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
  return (end > cut.length * 0.5 ? cut.slice(0, end + 1) : `${cut}…`).trim();
}

/** Rough prompt budget check: the native engine has a 4096-token window; refuse early so the caller can fall back. */
export function fitsContext(r: LocalRequest, maxTokens: number): boolean {
  const chars = r.system.length + r.messages.reduce((a, m) => a + m.content.length, 0);
  return Math.ceil(chars / 2.5) + maxTokens <= 4000;
}

let seq = 0;
/**
 * Runs one generation on the device. Throws LocalAiError('timeout') when no token arrived within the first-token budget
 * (the native generation is aborted), 'aborted' when `signal` fires, 'too_long' when the prompt cannot fit the context.
 */
export async function generateLocal(ai: LocalAi, r: LocalRequest, kind: AiKind, o: { signal?: AbortSignal; firstTokenMs?: number; totalMs?: number } = {}): Promise<string> {
  const maxTokens = Math.min(r.maxTokens ?? MAX_TOKENS[kind], MAX_TOKENS[kind]);
  if (!fitsContext(r, maxTokens)) throw new LocalAiError('too_long');
  if (o.signal?.aborted) throw new LocalAiError('aborted');
  const requestId = `g${Date.now().toString(36)}${++seq}`;
  let gotToken = false; let timedOut = false;
  const off = ai.onToken((e) => { if (e.requestId === requestId) { gotToken = true; clearTimeout(first); } });
  const stop = (why: 'timeout' | 'abort') => { if (why === 'timeout') timedOut = true; void ai.abort().catch(() => undefined); };
  const first = setTimeout(() => { if (!gotToken) stop('timeout'); }, o.firstTokenMs ?? FIRST_TOKEN_BUDGET_MS);
  const total = setTimeout(() => stop('timeout'), o.totalMs ?? TOTAL_BUDGET_MS);
  const onAbort = () => stop('abort');
  o.signal?.addEventListener('abort', onAbort, { once: true });
  try {
    const res = await ai.generate({ system: r.system, messages: r.messages, maxTokens, json: !!r.json, stream: true, requestId });
    let text = res.text.trim();
    if (!text) throw new LocalAiError('empty');
    if (kind === 'coach') text = limitWords(text);
    return text;
  } catch (e) {
    if (timedOut) throw new LocalAiError('timeout');
    if (o.signal?.aborted) throw new LocalAiError('aborted');
    throw e instanceof LocalAiError ? e : new LocalAiError('generation_failed');
  } finally {
    clearTimeout(first); clearTimeout(total); off(); o.signal?.removeEventListener('abort', onAbort);
  }
}
