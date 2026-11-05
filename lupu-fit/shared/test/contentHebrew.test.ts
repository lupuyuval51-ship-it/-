import { describe, expect, it } from 'vitest';
import { EXERCISES, FINISHERS, READY_WORKOUTS } from '../src/content/index.js';
import { FOCUS_LABEL } from '../src/content/focus.js';
import { generateReadyWorkouts, shortWorkoutName } from '../src/content/workoutGenerator.js';

/** Every Hebrew string of an item: fields ending in `He`, including arrays (steps, cues, mistakes). */
const heTexts = (o: Record<string, unknown>): string[] =>
  Object.entries(o).flatMap(([k, v]) => (!/He$/.test(k) ? [] : typeof v === 'string' ? [v] : Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []));

// A Hebrew word with optional one-letter prefixes (ו ה ש ב ל מ כ), so "וביטן" and "שהגומיה" are caught too.
const word = (stem: string, before = '(?<![א-ת])'): RegExp => new RegExp(`${before}[ושהבלמכ]{0,3}${stem}(?![א-ת])`);

describe('exercise and finisher Hebrew spelling', () => {
  const banned: [RegExp, string][] = [
    [word('ביטן'), 'misspelling: בטן'],
    [word('קשוח(?:ה|ים|ות)?'), '"tough" (of a person): use קשיח or מכווץ'],
    [word('לישר'), 'defective spelling: ליישר'],
    [word('גומיה'), 'mixed spelling: גומייה'],
    [word('ביספס'), 'mixed spelling: ביצפס'],
    // "דו-צדדית" / "חד-צדדי" (bilateral / unilateral) are correct; only the stand-alone "sideways" adjective is not.
    [word('צדדית', '(?<![א-ת-])'), 'mixed spelling: צידית'],
  ];

  it('uses one spelling per word in every Hebrew field', () => {
    const items: { id: string }[] = [...EXERCISES, ...FINISHERS];
    const hits = items.flatMap((it) => heTexts(it as unknown as Record<string, unknown>).flatMap((s) => banned.filter(([re]) => re.test(s)).map(([, why]) => `${it.id}: ${why} in "${s}"`)));
    expect(hits).toEqual([]);
  });

  it('keeps the correct compound forms that the spelling rule must not flag', () => {
    const sideways = (banned[5] as [RegExp, string])[0];
    expect(sideways.test('לאחיזה דו-צדדית ניטרלית')).toBe(false);
    expect(sideways.test('הליכה צדדית')).toBe(true);
  });
});

describe('gentle finisher copy does not claim more than the English', () => {
  it('makes no injury-return or no-joint-load claims', () => {
    for (const f of FINISHERS) {
      expect(f.descriptionHe, f.id).not.toMatch(/מפציעה|בלי עומס|ללא עומס/);
    }
  });
});

describe('ready workout names', () => {
  const STYLE_HE = ['כוח', 'סופר-סט', 'מעגל', 'פירמידה', 'צפיפות'];
  const STYLE_EN = ['Strength', 'Superset', 'Circuit', 'Pyramid', 'Density'];

  it('are focus and style only, with a number only to tell repeats apart', () => {
    for (const w of READY_WORKOUTS) {
      const f = FOCUS_LABEL[w.focus];
      expect(w.nameEn, w.id).toMatch(new RegExp(`^${f.en} – (${STYLE_EN.join('|')})( \\d+)?$`));
      expect(w.nameHe, w.id).toMatch(new RegExp(`^${f.he} – (${STYLE_HE.join('|')})( \\d+)?$`));
      // the level, place/gear and lead exercise are shown elsewhere, never repeated in the title
      expect(w.nameEn, w.id).not.toMatch(/Beginner|Intermediate|Advanced|Gym|Home|Park|\(|:/);
      expect(w.nameHe.length, w.id).toBeLessThanOrEqual(28);
      expect(w.nameEn.length, w.id).toBeLessThanOrEqual(28);
    }
  });

  it('stay unique in both languages', () => {
    expect(new Set(READY_WORKOUTS.map((w) => w.nameEn.toLowerCase())).size).toBe(READY_WORKOUTS.length);
    expect(new Set(READY_WORKOUTS.map((w) => w.nameHe)).size).toBe(READY_WORKOUTS.length);
  });

  it('the committed catalog matches the generator', () => {
    expect(generateReadyWorkouts(EXERCISES).workouts).toEqual(READY_WORKOUTS);
  });

  it('numbers only collisions, starting from 2', () => {
    const taken = new Set<string>();
    expect(shortWorkoutName('shoulders', 'straight', taken)).toEqual({ nameEn: 'Shoulders – Strength', nameHe: 'כתפיים – כוח' });
    expect(shortWorkoutName('shoulders', 'straight', taken)).toEqual({ nameEn: 'Shoulders – Strength 2', nameHe: 'כתפיים – כוח 2' });
    expect(shortWorkoutName('shoulders', 'circuit', taken).nameEn).toBe('Shoulders – Circuit');
  });
});
