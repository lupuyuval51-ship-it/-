#!/usr/bin/env tsx
/**
 * npm run audit:english
 * Fails when Hebrew letters appear anywhere English-mode users can see them:
 *  - every `*En` / `en` field of the authored content (exercises, foods, dishes, finishers, templates, ready workouts, generator labels)
 *  - the `en` side of every client dictionary feature and of the shared dictionary
 *  - English server-generated strings (safety responses, rules coach, error codes) and the manifest/HTML shell
 * It also checks that every server error code, achievement id and enum label has an English string.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ACHIEVEMENT_IDS } from '../shared/src/enums.ts';
import { EXERCISES, FOODS, DISHES, FINISHERS, MEAL_TEMPLATES, READY_WORKOUTS } from '../shared/src/content/index.ts';
import { en as sharedEn } from '../shared/src/i18n/en.ts';
import { safetyResponse, rulesCoachReply, type CoachSnapshot } from '../shared/src/coachRules.ts';
import { FOCUS_LABEL } from '../shared/src/content/focus.ts';

const ROOT = resolve(import.meta.dirname, '..');
const HE = /[֐-׿]/;
const leaks: string[] = [];
/** Language names written in their own script (endonyms) are the one legitimate Hebrew in the English UI. */
const ENDONYM = /(^|\.)lang\.(he|other)$/;
let checked = 0;

function scan(where: string, v: unknown): void {
  if (typeof v === 'string') { checked++; if (HE.test(v) && !ENDONYM.test(where)) leaks.push(`${where}: ${JSON.stringify(v.slice(0, 80))}`); return; }
  if (Array.isArray(v)) { v.forEach((x, i) => scan(`${where}[${i}]`, x)); return; }
  if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) scan(`${where}.${k}`, x);
}
const isEnKey = (k: string): boolean => k === 'en' || /(^|[a-z])En$/.test(k);
function scanEnFields(where: string, v: unknown): void {
  if (Array.isArray(v)) { v.forEach((x, i) => scanEnFields(`${where}[${i}]`, x)); return; }
  if (v && typeof v === 'object') {
    for (const [k, x] of Object.entries(v)) { if (isEnKey(k)) scan(`${where}.${k}`, x); else scanEnFields(`${where}.${k}`, x); }
  }
}
const missing: string[] = [];
const lookup = (tree: unknown, path: string): unknown => path.split('.').reduce<unknown>((c, p) => (c && typeof c === 'object' ? (c as Record<string, unknown>)[p] : undefined), tree);

// 1. authored content
const content: Record<string, readonly { id: string }[]> = { EXERCISES, FOODS, DISHES, FINISHERS, MEAL_TEMPLATES, READY_WORKOUTS };
for (const [name, list] of Object.entries(content)) for (const item of list) scanEnFields(`${name}:${item.id}`, item);
scanEnFields('FOCUS_LABEL', FOCUS_LABEL);
const gen = await import('../shared/src/content/workoutGenerator.ts') as Record<string, unknown>;
for (const [k, v] of Object.entries(gen)) if (v && typeof v === 'object') scanEnFields(`workoutGenerator.${k}`, v);

// 2. dictionaries
scan('shared/i18n/en', sharedEn);
const featDir = join(ROOT, 'client/src/i18n');
const dictFiles: string[] = [];
for (const sub of ['features', 'custom']) {
  try { for (const f of readdirSync(join(featDir, sub))) if (f.endsWith('.ts') && !f.endsWith('.test.ts')) dictFiles.push(join(featDir, sub, f)); } catch { /* optional folder */ }
}
const clientEn: Record<string, unknown> = {};
const mergeInto = (a: Record<string, unknown>, b: Record<string, unknown>): void => {
  for (const [k, v] of Object.entries(b)) { if (v && typeof v === 'object') { const cur = a[k]; a[k] = cur && typeof cur === 'object' ? cur : {}; mergeInto(a[k] as Record<string, unknown>, v as Record<string, unknown>); } else a[k] = v; }
};
const keysOf = (v: unknown, p = ''): string[] => (v && typeof v === 'object' ? Object.entries(v).flatMap(([k, x]) => keysOf(x, p ? `${p}.${k}` : k)) : [p]);
for (const f of dictFiles) {
  const mod = (await import(pathToFileURL(f).href)) as { default?: { en?: unknown; he?: unknown } };
  const d = mod.default;
  if (!d || typeof d !== 'object' || !('en' in d)) continue; // custom/* may export other shapes
  scan(`${f.replace(ROOT + '/', '')}#en`, d.en);
  if (d.he) { const a = new Set(keysOf(d.en)), b = new Set(keysOf(d.he)); for (const k of a) if (!b.has(k)) missing.push(`${f}: he missing ${k}`); for (const k of b) if (!a.has(k)) missing.push(`${f}: en missing ${k}`); }
  mergeInto(clientEn, structuredClone(d.en) as Record<string, unknown>);
}
// empty English strings
for (const k of keysOf(clientEn)) { const v = lookup(clientEn, k); if (typeof v === 'string' && v.trim() === '' && !/\.(none|sep|empty)$/.test(k)) missing.push(`empty en string: ${k}`); }

// 3. server error codes / achievements / enum labels must have English text
const walkSrc = (d: string): string[] => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walkSrc(join(d, e.name)) : e.name.endsWith('.ts') ? [join(d, e.name)] : []));
const codes = new Set<string>(['network', 'generic', 'bad_request', 'rate_limited', 'forbidden']);
for (const f of walkSrc(join(ROOT, 'server/src'))) {
  const src = readFileSync(f, 'utf8');
  for (const m of src.matchAll(/(?:ApiError\(\d+,\s*|notFound\(|badRequest\(|unauthorized\()'([a-z0-9_]+)'/g)) codes.add(m[1] as string);
}
const SKIP_CODES = new Set(['csrf_invalid', 'idempotency_key_reused', 'payload_too_large', 'order_mismatch']);
for (const c of codes) if (!SKIP_CODES.has(c) && typeof lookup(clientEn, `error.${c}`) !== 'string') missing.push(`error.${c} has no English message`);
for (const id of ACHIEVEMENT_IDS) if (typeof lookup(clientEn, `label.achievement.${id}`) !== 'string') missing.push(`label.achievement.${id} missing`);

// 4. server-generated English strings
for (const cat of ['self_harm', 'medical_emergency', 'eating_disorder', 'ped_dosing'] as const) scan(`safetyResponse(${cat},en)`, safetyResponse(cat, 'en'));
const snap: CoachSnapshot = {
  ageBucket: 'adult', goal: 'muscle', todayWorkout: { name: 'Push Day', exerciseCount: 5 }, recentWorkouts: [{ date: '2026-01-01', sets: 12 }],
  prs: [{ exerciseName: 'Bench Press', est1rmKg: 90 }], nutrition7d: { loggedDays: 5, avgKcal: 2400, avgProteinG: 140 }, targets: { kcal: 2500, proteinG: 150 },
  weightTrendKg: { deltaKg: 0.4, days: 14 }, readiness: 'rest',
} as unknown as CoachSnapshot;
for (const q of ['workout today', 'protein', 'calories', 'weight', 'pr', 'sore tired', 'hello']) scan(`rulesCoachReply(${q},en)`, rulesCoachReply(q, snap, 'en'));
scan('rulesCoachReply(no-data,en)', rulesCoachReply('protein', { ...snap, nutrition7d: { loggedDays: 0, avgKcal: null, avgProteinG: null }, targets: null, prs: [], weightTrendKg: null, todayWorkout: null }, 'en'));

// 5. shell: manifest + html
for (const f of ['client/public/manifest.en.webmanifest']) {
  const j = JSON.parse(readFileSync(join(ROOT, f), 'utf8')) as Record<string, unknown>;
  const loc = j.name_localized ?? j.description;
  scan(`${f}`, { name: j.name, short_name: j.short_name, description: j.description, loc, shortcuts: j.shortcuts });
  if (j.lang !== 'en' || j.dir !== 'ltr') missing.push(`${f}: lang/dir must be en/ltr`);
}
const html = readFileSync(join(ROOT, 'client/index.html'), 'utf8');
for (const m of html.matchAll(/<(?:title|meta name="description" content=")[^>]*>?([^<"]*)/g)) scan('index.html', m[1]);

console.log(`audit-english: ${checked} English strings scanned, ${dictFiles.length} dictionary files`);
for (const m of missing) console.error('missing: ' + m);
for (const l of leaks) console.error('HEBREW IN ENGLISH: ' + l);
const total = leaks.length + missing.length;
console.log(`audit-english: ${total} problems (${leaks.length} Hebrew leaks, ${missing.length} missing/mismatched)`);
process.exit(total ? 1 : 0);
