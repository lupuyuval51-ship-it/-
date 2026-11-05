import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { EXERCISES_ALL, DISHES_RAW_ALL, FINISHERS_ALL } from '../shared/src/content/sources.ts';
import { READY_WORKOUTS_GENERATED } from '../shared/src/content/data/readyWorkouts.generated.ts';

/** store-assets/play-listing.md: Play limits, stated counts and the content numbers must stay true. */
const md = readFileSync(resolve(__dirname, '..', 'store-assets', 'play-listing.md'), 'utf8');
const LIMITS: Record<string, number> = { Title: 30, 'Short description': 80, 'Full description': 4000 };

interface Field { name: string; max: number; stated: number; text: string }
function fields(section: string): Field[] {
  return [...section.matchAll(/^### (.+?) \(max (\d+)\): (\d+) characters\n```text\n([\s\S]*?)\n```/gm)].map((m) => ({
    name: m[1] as string, max: Number(m[2]), stated: Number(m[3]), text: m[4] as string,
  }));
}
const sections = md.split(/^## /m).slice(1);
const byLang = (prefix: string): string => {
  const s = sections.find((x) => x.startsWith(prefix));
  if (!s) throw new Error(`missing section ${prefix}`);
  return s;
};

describe('play listing', () => {
  for (const lang of ['Hebrew', 'English']) {
    describe(lang, () => {
      const fs = fields(byLang(lang));
      it('has a title, a short and a full description', () => {
        expect(fs.map((f) => f.name)).toEqual(['Title', 'Short description', 'Full description']);
      });
      for (const f of fs) {
        it(`${f.name}: Play limit, and the stated count is the measured one`, () => {
          expect(f.max).toBe(LIMITS[f.name]);
          expect([...f.text].length).toBe(f.stated);
          expect(f.stated).toBeLessThanOrEqual(f.max);
        });
      }
      it('no exclamation marks or buzzwords', () => {
        const text = fs.map((f) => f.text).join('\n');
        expect(text).not.toMatch(/!/);
        expect(text).not.toMatch(/\b(unlock|journey|transform|seamless|ultimate|amazing|best|perfect|revolutionary)\b/i);
      });
      it('content numbers match the content files and the honest caveats are present', () => {
        const full = fs.find((f) => f.name === 'Full description')?.text ?? '';
        for (const n of [EXERCISES_ALL.length, READY_WORKOUTS_GENERATED.length, DISHES_RAW_ALL.length, FINISHERS_ALL.length]) {
          expect(full).toContain(String(n));
        }
        expect(full).toContain('Open Food Facts');
        expect(full).toContain('13');
        expect(full).toContain('18');
      });
      it('makes none of the claims the code does not back up', () => {
        const text = fs.map((f) => f.text).join('\n');
        const he = lang === 'Hebrew';
        // Finish workout needs a connection in Device Mode: no "works offline".
        expect(text).not.toMatch(he ? /בלי חיבור לאינטרנט|ללא חיבור|אופליין/ : /without an internet connection|offline/i);
        // Android export writes no file: no "export as a JSON file".
        expect(text).not.toMatch(/JSON|ייצא|ייצוא|export/i);
        // Open Food Facts sees more than the barcode number.
        expect(text).not.toMatch(he ? /רק מספר הברקוד/ : /only the barcode number/i);
        expect(text).toContain('IP');
        // Reminder delay is not bounded or verified.
        expect(text).not.toMatch(he ? /כמה דקות/ : /few minutes/i);
        // XP also comes from food logging and weigh-ins, and is capped.
        expect(text).toMatch(he ? /XP על אימונים, רישום אוכל ושקילות, עם תקרות/ : /XP for workouts, food logging and weigh-ins, with daily and weekly caps/);
      });
    });
  }
});
