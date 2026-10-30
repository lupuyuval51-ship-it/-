import { describe, expect, it } from 'vitest';
import { EXERCISE_LIBRARY } from '../src/data/exercises/index';
import type { ExerciseRecord } from '../src/modules/exercises/repository';
import { allowedTypos, editDistance, normalizeSearchText, queryTerms, scoreExercise, searchExercises, termVariants } from '../src/modules/exercises/search';

const LIBRARY: ExerciseRecord[] = EXERCISE_LIBRARY.map((e) => ({ ...e, media: null }));
const byId = (id: string) => LIBRARY.find((e) => e.id === id)!;

/** Ids of the matches, best first (ties keep library order). */
function search(q: string) {
  const { matches, approximate } = searchExercises(LIBRARY, q);
  const ids = [...matches].sort((a, b) => b.score - a.score).map((m) => m.item.id);
  return { ids, approximate };
}

describe('normalizeSearchText', () => {
  it('lower-cases, strips diacritics, niqqud, apostrophes and punctuation', () => {
    expect(normalizeSearchText('  Push-Up  ')).toBe('push up');
    expect(normalizeSearchText("Farmer's Carry")).toBe('farmers carry');
    expect(normalizeSearchText('Café')).toBe('cafe');
    expect(normalizeSearchText('שְׁכִיבוֹת סְמִיכָה')).toBe('שכיבות סמיכה');
    expect(normalizeSearchText('מכונת סמית׳')).toBe('מכונת סמית');
    expect(normalizeSearchText('צ\'ין־אפ')).toBe('צינ אפ');
  });

  it('unifies Hebrew final letters so partial words match', () => {
    expect(normalizeSearchText('סקוואטים')).toBe('סקוואטימ');
    expect(normalizeSearchText('ךםןףץ')).toBe('כמנפצ');
  });

  it('splits queries into unique terms', () => {
    expect(queryTerms('Bench  bench press!')).toEqual(['bench', 'press']);
    expect(queryTerms('   ')).toEqual([]);
  });
});

describe('termVariants', () => {
  it('adds English singular forms', () => {
    expect(termVariants('squats')).toContain('squat');
    expect(termVariants('presses')).toContain('press');
    expect(termVariants('abs')).toEqual(['abs']); // too short to strip
  });

  it('strips one Hebrew prefix letter and common endings', () => {
    const v = termVariants(normalizeSearchText('הסקוואטים'));
    expect(v).toContain('סקוואט');
    expect(termVariants('לחיצה')).toContain('לחיצ');
    expect(termVariants('עלייה')).toContain('עלי');
    expect(termVariants('מוט')).toEqual(['מוט']); // short words are left alone
  });
});

describe('editDistance', () => {
  it('counts substitutions, insertions, deletions and transpositions', () => {
    expect(editDistance('squat', 'squat', 2)).toBe(0);
    expect(editDistance('sqaut', 'squat', 2)).toBe(1);
    expect(editDistance('sqat', 'squat', 2)).toBe(1);
    expect(editDistance('deadlfit', 'deadlift', 2)).toBe(1);
    expect(editDistance('abcdef', 'uvwxyz', 2)).toBe(3); // capped at max + 1
  });

  it('allows more typos for longer words and none for short ones', () => {
    expect(allowedTypos('abc')).toBe(0);
    expect(allowedTypos('squat')).toBe(1);
    expect(allowedTypos('kettlebell')).toBe(2);
  });
});

describe('searchExercises', () => {
  it('returns everything with an empty query', () => {
    expect(searchExercises(LIBRARY, '').matches).toHaveLength(LIBRARY.length);
    expect(searchExercises(LIBRARY, undefined).approximate).toBe(false);
  });

  it('finds exercises by English name, partial word and plural', () => {
    for (const q of ['squat', 'squ', 'Squats', 'SQUAT']) {
      const { ids, approximate } = search(q);
      expect(ids, q).toContain('barbell_back_squat');
      expect(ids, q).toContain('goblet_squat');
      expect(approximate).toBe(false);
    }
  });

  it('finds exercises by Hebrew name with prefixes, plurals and partial words', () => {
    for (const q of ['סקוואט', 'סקוו', 'סקוואטים', 'הסקוואט']) expect(search(q).ids, q).toContain('barbell_back_squat');
    expect(search('לחיצה').ids).toContain('barbell_bench_press'); // לחיצה ↔ לחיצת
    expect(search('עלייה').ids).toContain('pull_up'); // עלייה ↔ עליות
    expect(search('שכיבת סמיכה').ids).toContain('push_up');
  });

  it('matches across word boundaries and hyphenation', () => {
    expect(search('pullup').ids[0]).toBe('pull_up');
    expect(search('push-up').ids[0]).toBe('push_up');
    expect(search('push up').ids[0]).toBe('push_up');
  });

  it('ranks exact names first', () => {
    expect(search('plank').ids[0]).toBe('plank');
    expect(search('פלאנק').ids[0]).toBe('plank');
    expect(search('bench press').ids.slice(0, 5)).toContain('barbell_bench_press');
  });

  it('finds exercises by muscle, equipment and category labels in both languages', () => {
    expect(search('quads').ids).toContain('barbell_back_squat');
    expect(search('חזה').ids).toContain('barbell_bench_press');
    expect(search('גומייה').ids).toContain('band_row');
    expect(search('kettlebell').ids).toEqual(expect.arrayContaining(['kettlebell_swing', 'kettlebell_overhead_press']));
    const noEquipment = search('no equipment').ids;
    expect(noEquipment.length).toBeGreaterThan(10);
    for (const id of noEquipment) expect(byId(id).equipment, id).toEqual([]);
    expect(search('ללא ציוד').ids.sort()).toEqual([...noEquipment].sort());
  });

  it('requires every term to match', () => {
    const ids = search('dumbbell row').ids;
    expect(ids).toContain('one_arm_dumbbell_row');
    // Every term must match: each hit has "dumbbell" and "row" in its name or equipment, and nothing that has only one of them is returned.
    const text = (id: string) => `${byId(id).name.en} ${byId(id).equipment.join(' ')}`.toLowerCase();
    for (const id of ids) {
      expect(text(id), id).toContain('dumbbell');
      expect(text(id), id).toMatch(/\brow/);
    }
    const expected = LIBRARY.filter((e) => /dumbbell/.test(text(e.id)) && /\brow/.test(text(e.id))).map((e) => e.id);
    expect([...ids].sort()).toEqual(expected.sort());
  });

  it('does not match very short terms inside unrelated words', () => {
    // "גב" (back) must not match "מוגבהות" (raised) in push-up names.
    const back = search('גב').ids;
    expect(back).toContain('pull_up');
    expect(back).not.toContain('incline_push_up');
    expect(search('x').ids).toEqual([]);
    // "ביספס" must not reach triceps-only exercises through the stripped form "יספס".
    expect(search('ביספס').ids).not.toContain('triceps_pushdown');
  });

  it('falls back to spelling-tolerant matching and flags it as approximate', () => {
    const typo = search('sqaut');
    expect(typo.approximate).toBe(true);
    expect(typo.ids).toContain('barbell_back_squat');
    expect(search('benhc press').ids).toContain('barbell_bench_press');
    expect(search('deadlfit').ids).toContain('deadlift');
    expect(search('zzzzqqq')).toEqual({ ids: [], approximate: false });
  });

  it('scores a non-matching exercise as zero', () => {
    expect(scoreExercise(byId('plank'), ['squat'])).toBe(0);
    expect(scoreExercise(byId('plank'), [])).toBe(1);
  });
});
