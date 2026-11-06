import { del, get, keys as idbKeys, set } from 'idb-keyval';
import { TRANSLATE_MAX_KEYS } from '@lupu-fit/shared';

export type Tree = { [k: string]: string | Tree };
/** Keys that are deliberately never machine-translated (legal text must stay as authored). */
export const EXCLUDED_PREFIXES = ['legal.', 'legalDev.', 'dev.'];

export function flatten(tree: Tree, prefix = '', out: Record<string, string> = {}): Record<string, string> {
  for (const [k, v] of Object.entries(tree)) { const p = prefix ? `${prefix}.${k}` : k; if (typeof v === 'string') out[p] = v; else flatten(v, p, out); }
  return out;
}
/** Path segments that would reach Object.prototype: a stored (IndexedDB) or tampered entry must never be able to write there. */
const UNSAFE_SEGMENTS = new Set(['__proto__', 'constructor', 'prototype']);
export function unflatten(flat: Record<string, string>): Tree {
  const root: Tree = {};
  for (const [path, v] of Object.entries(flat)) {
    if (typeof v !== 'string') continue; // only text is ever rendered
    const parts = path.split('.');
    if (parts.some((p) => UNSAFE_SEGMENTS.has(p))) continue;
    let cur = root;
    parts.forEach((part, i) => { if (i === parts.length - 1) cur[part] = v; else { const n = cur[part]; cur = typeof n === 'object' ? n : (cur[part] = {}); } });
  }
  return root;
}
export const translatable = (flat: Record<string, string>): Record<string, string> =>
  Object.fromEntries(Object.entries(flat).filter(([k, v]) => v.trim() !== '' && !EXCLUDED_PREFIXES.some((p) => k.startsWith(p))));

/** FNV-1a 32-bit, base36. Enough to detect an edited source string. */
export function hash(s: string): string { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(36); }
export const dictHash = (flat: Record<string, string>): string => hash(Object.keys(flat).sort().map((k) => `${k}\u0000${flat[k]}`).join('\u0001'));

export function batch<T>(entries: [string, T][], size = TRANSLATE_MAX_KEYS, maxChars = 14000): Record<string, T>[] {
  const out: Record<string, T>[] = []; let cur: Record<string, T> = {}; let n = 0; let chars = 0;
  for (const [k, v] of entries) {
    const len = k.length + (typeof v === 'string' ? v.length : 0) + 6;
    if (n > 0 && (n >= size || chars + len > maxChars)) { out.push(cur); cur = {}; n = 0; chars = 0; }
    cur[k] = v; n++; chars += len;
  }
  if (n > 0) out.push(cur);
  return out;
}

const PH = /\{(\w+)\}/g;
export const samePlaceholders = (src: string, out: string): boolean => {
  const a = [...src.matchAll(PH)].map((m) => m[1]).sort().join(','); const b = [...out.matchAll(PH)].map((m) => m[1]).sort().join(',');
  return a === b;
};

/** Persisted translation. `src` maps key -> hash of the English string it was translated from. */
export interface StoredLang { code: string; name: string; dir: 'rtl' | 'ltr'; dictHash: string; updatedAt: number; entries: Record<string, string>; src: Record<string, string>; fallbackKeys: number; total: number }
export interface LangStore { get(code: string): Promise<StoredLang | undefined>; put(l: StoredLang): Promise<void>; remove(code: string): Promise<void>; list(): Promise<StoredLang[]> }
const PFX = 'lf-i18n:';
export const idbStore: LangStore = {
  get: async (c) => { try { return await get<StoredLang>(PFX + c); } catch { return undefined; } },
  put: async (l) => { await set(PFX + l.code, l); },
  remove: async (c) => { try { await del(PFX + c); } catch { /* ignore */ } },
  list: async () => { try { const ks = (await idbKeys()).filter((k) => typeof k === 'string' && k.startsWith(PFX)) as string[]; return (await Promise.all(ks.map((k) => get<StoredLang>(k)))).filter((x): x is StoredLang => !!x); } catch { return []; } },
};

export type Poster = (target: { code: string; name: string }, keys: Record<string, string>, signal?: AbortSignal) => Promise<{ translations: Record<string, string>; fallback: string[] }>;
export interface RunOpts { target: { code: string; name: string }; dir: 'rtl' | 'ltr'; source: Record<string, string>; store: LangStore; post: Poster; signal?: AbortSignal; onProgress?: (done: number, total: number) => void; now?: () => number }
export type RunResult = { status: 'cached'; lang: StoredLang; batches: 0 } | { status: 'translated'; lang: StoredLang; batches: number };

/**
 * Ensures a stored translation exists and is current. A hit on the whole-dictionary hash costs nothing; otherwise only
 * keys that are new or whose English source changed (per-key hash) are sent. Each finished batch is saved immediately,
 * so cancel/failure keeps partial progress and a retry resumes. Server-side English fallbacks are never stored as translations.
 */
export async function ensureTranslation(o: RunOpts): Promise<RunResult> {
  const source = translatable(o.source); const dh = dictHash(source);
  const prev = await o.store.get(o.target.code);
  if (prev && prev.dictHash === dh) return { status: 'cached', lang: prev, batches: 0 };
  const entries: Record<string, string> = {}; const src: Record<string, string> = {};
  for (const [k, v] of Object.entries(source)) if (prev && prev.src[k] === hash(v) && prev.entries[k] !== undefined) { entries[k] = prev.entries[k]; src[k] = prev.src[k]; }
  const todo = Object.entries(source).filter(([k]) => entries[k] === undefined);
  const batches = batch(todo);
  const make = (): StoredLang => ({ code: o.target.code, name: o.target.name, dir: o.dir, dictHash: Object.keys(entries).length === Object.keys(source).length ? dh : 'partial', updatedAt: (o.now ?? Date.now)(), entries: { ...entries }, src: { ...src }, fallbackKeys: Object.keys(source).length - Object.keys(entries).length, total: Object.keys(source).length });
  o.onProgress?.(0, batches.length);
  let i = 0;
  for (const b of batches) {
    if (o.signal?.aborted) throw new DOMException('aborted', 'AbortError');
    const res = await o.post(o.target, b, o.signal);
    const bad = new Set(res.fallback);
    for (const [k, srcText] of Object.entries(b)) {
      const v = res.translations[k];
      if (typeof v === 'string' && !bad.has(k) && v.trim() !== '' && samePlaceholders(srcText, v)) { entries[k] = v; src[k] = hash(srcText); }
    }
    await o.store.put(make());
    o.onProgress?.(++i, batches.length);
  }
  const lang = make();
  // dictHash stays 'partial' when some keys fell back, so the next open retries only those keys.
  await o.store.put(lang);
  return { status: 'translated', lang, batches: batches.length };
}

/** English wins for any key the stored language lacks. */
export const overlayTree = (l: StoredLang): Tree => unflatten(l.entries);
