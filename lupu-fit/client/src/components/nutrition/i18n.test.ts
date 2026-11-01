import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DICT, lookup } from '../../i18n/index.tsx';

const SRC = resolve(__dirname, '../..');
const walk = (d: string): string[] => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const mine = [
  'pages/Nutrition.tsx', 'pages/NutritionLog.tsx', 'pages/NutritionMenu.tsx', 'pages/Coach.tsx', 'pages/Profile.tsx',
  ...['nutrition', 'coach', 'profile'].flatMap((d) => walk(join(SRC, 'components', d)).map((p) => p.slice(SRC.length + 1))),
].filter((f) => /\.tsx?$/.test(f) && !/\.test\./.test(f) && !f.includes('testHarness'));

describe('i18n coverage for nutrition / coach / profile', () => {
  const keys = new Set<string>();
  for (const f of mine) for (const m of readFileSync(join(SRC, f), 'utf8').matchAll(/['"`]((?:nutrition|coach|profile|outbox|disclaimer|label|unit|action|date|state|error)\.[A-Za-z0-9_.]+)['"`]/g)) keys.add(m[1]!);
  it('finds keys to check', () => { expect(keys.size).toBeGreaterThan(100); });
  it('every literal key exists in both languages', () => {
    const missing = [...keys].filter((k) => !/\.$/.test(k)).filter((k) => lookup('en', k) === undefined || lookup('he', k) === undefined);
    expect(missing).toEqual([]);
  });
  it('dynamic key families are complete', () => {
    const fam: Record<string, string[]> = {
      'nutrition.kind': ['food', 'dish', 'template', 'custom', 'recent', 'barcode'], 'coach.prompts': ['workout', 'protein', 'weight', 'recovery'],
      'profile.note': ['minor_no_deficit', 'floor_applied', 'custom_clamped', 'carb_floor_raised_kcal', 'bmi_adjusted_protein', 'deficit_capped_at_bmr'],
      'label.slot': ['breakfast', 'lunch', 'dinner', 'snack'], 'label.allergen': ['dairy', 'egg', 'peanut', 'tree_nut', 'sesame', 'soy', 'gluten', 'fish', 'shellfish'],
    };
    for (const [p, ks] of Object.entries(fam)) for (const k of ks) for (const l of ['en', 'he'] as const) expect(lookup(l, `${p}.${k}`), `${l} ${p}.${k}`).toBeTypeOf('string');
  });
  it('Hebrew strings use proper typography and keep placeholders', () => {
    const he = DICT.he as Record<string, unknown>; const en = DICT.en as Record<string, unknown>;
    const flat = (o: unknown, p = '', out: Record<string, string> = {}): Record<string, string> => { if (typeof o === 'string') out[p] = o; else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) flat(v, p ? `${p}.${k}` : k, out); return out; };
    for (const ns of ['nutrition', 'coach', 'profile']) {
      const h = flat(he[ns], ns); const e = flat(en[ns], ns);
      expect(Object.keys(h).sort()).toEqual(Object.keys(e).sort());
      for (const [k, v] of Object.entries(h)) {
        expect(/[א-ת]["']/.test(v), `ASCII quote in ${k}`).toBe(false);
        expect(/התחל\/י|בחר\/י/.test(v), `gendered form in ${k}`).toBe(false);
        expect([...v.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort(), `placeholders ${k}`).toEqual([...e[k]!.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort());
      }
    }
  });
});
