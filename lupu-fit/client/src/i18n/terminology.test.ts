import { describe, expect, it } from 'vitest';
import { DICTIONARIES } from '@lupu-fit/shared';
import { DICT, lookup, makeT } from './index.tsx';

const flat = (o: unknown, p = '', out: Record<string, string> = {}): Record<string, string> => {
  if (typeof o === 'string') out[p] = o;
  else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) flat(v, p ? `${p}.${k}` : k, out);
  return out;
};
const heAll = { ...flat(DICT.he), ...flat(DICTIONARIES.he, 'shared') };
const he = (k: string): string => { const v = lookup('he', k); if (v === undefined) throw new Error(`missing he ${k}`); return v; };
const en = (k: string): string => { const v = lookup('en', k); if (v === undefined) throw new Error(`missing en ${k}`); return v; };

describe('Hebrew terminology and grammar', () => {
  it('has no literal translations or misspellings that were reviewed out', () => {
    const banned: [RegExp, string][] = [
      [/רצפ(ת|ות) (ה)?בטיחות/, 'safety floor: use המינימום הבטוח'],
      [/ערכת נושא/, 'theme: use עיצוב'],
      [/למתחת/, 'ungrammatical למתחת'],
      [/הגרעון/, 'spelling: גירעון'],
      [/היצרן/, '"manufacturer" for the plan generator'],
      [/מדולל/, '"watered down"'],
      [/במאגר/, '"in the tank"'],
      [/עלייה נקייה/, '"lean gain"'],
      [/מקצב יציב/, '"slower than a steady pace"'],
      [/אימונים מתקדמים/, '"progressive" rendered as "advanced"'],
      [/בשכבה החינמית/, 'free tier: use המסלול החינמי'],
      [/באלטרנטיבה/, 'swap: use חלופה'],
      [/^מה כדאי להתאמן/, 'missing preposition'],
      [/מתואם/, '"coordinated" for adjusted: use מתוקן'],
      [/תוקף ההפעלה/, '"launch" for a web session'],
      [/(?<!מ-)\{from\} עד \{to\}/, 'a change from X to Y reads as a range: use מ־{from} ל־{to}'],
    ];
    expect(heAll['shared.coach.freeTierPrivacy']).toMatch(/Google/);
    const hits = Object.entries(heAll).flatMap(([k, v]) => banned.filter(([re]) => re.test(v)).map(([, why]) => `${k}: ${why}`));
    expect(hits).toEqual([]);
  });

  it('names the theme setting the same way in onboarding and Profile', () => {
    expect(he('profile.f.theme')).toBe(he('onboarding.prefs.theme'));
    for (const o of ['dark', 'light', 'system']) expect(he(`profile.theme.${o}`)).toBe(he(`onboarding.prefs.themes.${o}`));
  });

  it('states required actions as required, not as advice', () => {
    for (const k of ['error.unauthorized', 'error.csrf_invalid', 'error.date_required', 'error.range_required', 'error.profile_required', 'nutrition.photo.notImage']) {
      expect(he(k), k).not.toMatch(/כדאי/);
      expect(he(k), k).toMatch(/צריך/);
    }
  });

  it('labels the grams stepper without a unit, so the stepper suffix is not repeated', () => {
    expect(en('nutrition.log.amount')).toBe('Amount');
    expect(he('nutrition.log.amount')).toBe('כמות');
    expect(en('nutrition.log.amount')).not.toMatch(/\(/);
    expect(he('nutrition.log.amount')).not.toMatch(/\(/);
  });
});

describe('privacy policy matches what the app does', () => {
  it('describes no password reset links and gives the real session lifetimes (both languages)', () => {
    for (const l of ['en', 'he'] as const) {
      const policy = Object.values(flat((DICT[l] as Record<string, unknown>)['legal'])).join('\n');
      expect(policy, l).not.toMatch(/reset links|קישורי איפוס/i);
    }
    expect(en('legal.privacy.s8.p1')).toMatch(/There is no password reset/);
    expect(en('legal.privacy.s8.p1')).toMatch(/30 days/);
    expect(en('legal.privacy.s8.p1')).toMatch(/12 hours/);
    expect(he('legal.privacy.s8.p1')).toMatch(/אין איפוס סיסמה/);
    expect(he('legal.privacy.s8.p1')).toMatch(/30 יום/);
    expect(he('legal.privacy.s8.p1')).toMatch(/12 שעות/);
  });

  it('says that chat messages, not only a snapshot, reach the AI provider', () => {
    expect(en('legal.privacy.s5.p1')).not.toMatch(/only an anonymised snapshot/);
    expect(en('legal.privacy.s5.p1')).toMatch(/recent messages of that chat/);
    expect(he('legal.privacy.s5.p1')).toMatch(/ההודעות האחרונות באותה שיחה/);
    expect(en('legal.privacy.s2.b5')).not.toMatch(/only if/);
    expect(he('legal.privacy.s2.b5')).not.toMatch(/רק אם/);
  });
});

describe('counts of one', () => {
  const tHe = makeT('he'); const tEn = makeT('en');
  const isolate = (s: string): string => `\u2066${s}\u2069`;

  it('uses the singular variant when the count is 1, in both languages', () => {
    expect(tHe('home.week.left', { n: 1 })).toBe('עוד אימון אחד להשגת היעד השבועי.');
    expect(tHe('home.resume.sets', { n: 1 })).toBe('סט אחד תועד עד עכשיו');
    expect(tEn('home.resume.sets', { n: 1 })).toBe('1 set logged so far');
    expect(tHe('nutrition.hub.copied', { n: 1 })).toBe('הועתק פריט אחד');
    expect(tHe('nutrition.hub.mealLogged', { n: 1 })).toBe('תועד פריט אחד');
    expect(tHe('workouts.plan.progressionApplied', { n: 1 })).toBe('משקל אחד עודכן לפי ההיסטוריה שלך.');
    // the only parameter is the count, even when it is not called n
    expect(tHe('workouts.note.time_trimmed', { removed: 1 })).toMatch(/תרגיל אחד הוסר/);
    expect(tEn('workouts.note.time_trimmed', { removed: 1 })).toMatch(/1 exercise removed/);
    // numbers wrapped in bidi isolates (Progress keeps them LTR) still count as 1; other parameters are kept
    expect(tEn('progress.take.sessions', { n: isolate('1'), g: isolate('17') })).toBe(`In this range: 1 workout, ${isolate('17')} planned.`);
    expect(tHe('progress.take.sessionsNoGoal', { n: isolate('1') })).toBe('בטווח הזה: אימון אחד.');
    expect(tEn('progress.consistency.goal', { n: 1 })).toBe('Weekly goal: 1 workout');
  });

  it('keeps the plural for other counts and for keys without a singular variant', () => {
    expect(tHe('home.week.left', { n: 2 })).toBe('עוד 2 אימונים להשגת היעד השבועי.');
    expect(tEn('progress.take.sessions', { n: isolate('5'), g: isolate('1') })).toBe(`In this range: ${isolate('5')} workouts, ${isolate('1')} planned.`);
    expect(tEn('final.live.confirmLeft', { n: 1 })).toBe(lookup('en', 'final.live.confirmLeftOne'));
    expect(tEn('progress.weight.aria', { n: 1, from: 1, to: 2 })).toBe(lookup('en', 'progress.weight.aria')!.replace('{n}', '1').replace('{from}', '1').replace('{to}', '2'));
  });

  it('never renders "1" before a plural noun for the counted messages', () => {
    const keys = ['home.resume.sets', 'home.week.left', 'nutrition.hub.copied', 'nutrition.hub.mealLogged', 'exercises.safeHidden', 'workouts.ready.hidden',
      'workouts.plan.progressionApplied', 'workouts.plan.progressionNoHistory', 'progress.take.sessionsNoGoal', 'progress.consistency.goal'];
    for (const k of keys) {
      expect(tHe(k, { n: 1 }), k).not.toMatch(/(^|\D)1 /);
      expect(tEn(k, { n: 1 }), k).not.toMatch(/\b1 (workouts|sets|items|exercises|weights)\b/);
    }
  });
});

describe('Hebrew changes and headings say what they mean', () => {
  it('words a change as from X to Y, not as a range', () => {
    expect(he('progress.weight.suggestionKcal')).toMatch(/מ־\{from\} ל־\{to\}/);
    expect(he('progress.take.weight')).toMatch(/מ־\{from\} ל־\{to\}/);
    expect(he('progress.take.strength')).toMatch(/מ־\{from\} ל־\{to\}/);
  });

  it('does not reuse the injury word "sensitive area" for the account deletion heading', () => {
    expect(he('profile.nu.danger')).not.toMatch(/רגיש/);
  });
});

describe('copy promises only what the app does', () => {
  it('never says Android reminders can arrive early, and states the real delay', () => {
    expect(en('automation.note.native')).not.toMatch(/before|early|few minutes/i);
    expect(en('automation.note.native')).toMatch(/later/);
    expect(he('automation.note.native')).not.toMatch(/לפני|כמה דקות/);
    expect(he('automation.note.native')).toMatch(/מאוחר יותר/);
  });

  it('does not suggest a focus that the generator ignores', () => {
    for (const k of ['workouts.gen.prefsHint', 'workouts.gen.prefsPlaceholder']) {
      expect(en(k), k).not.toMatch(/focus/i);
      expect(he(k), k).not.toMatch(/דגש/);
    }
  });
});
