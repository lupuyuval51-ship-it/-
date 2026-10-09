/**
 * Server-side strings for the few texts the workouts module stores in the database
 * (default plan/workout names, plan description, per-exercise coaching notes). They are
 * written in the user's account locale at creation time and stay editable by the user.
 * Everything else (generator notes, labels) is rendered client-side from codes.
 */
import type { ExperienceLevel, Goal, Locale, SplitType, TrainingLocation } from '@shared/constants';

type FocusBase = 'full_body' | 'upper' | 'lower' | 'push' | 'pull' | 'legs';

interface Strings {
  focus: Record<FocusBase, string>;
  goal: Record<Goal, string>;
  split: Record<SplitType, string>;
  experience: Record<ExperienceLevel, string>;
  location: Record<TrainingLocation, string>;
  planName: string;
  planDescription: string;
  copyName: string;
  dayName: string;
  exercise: {
    oneRm: string;
    lifts: { squat: string; bench: string; deadlift: string };
    benchmarkReps: string;
    benchmarkSeconds: string;
    perSide: string;
    perSideTime: string;
    power: string;
    finisher: string;
  };
}

const en: Strings = {
  focus: { full_body: 'Full body', upper: 'Upper body', lower: 'Lower body', push: 'Push', pull: 'Pull', legs: 'Legs' },
  goal: {
    muscle_gain: 'Build muscle',
    strength: 'Get stronger',
    general_fitness: 'General fitness',
    fat_loss: 'Lose fat',
    athletic_performance: 'Athletic performance',
  },
  split: {
    full_body: 'Full body',
    upper_lower: 'Upper / lower',
    push_pull_legs: 'Push / pull / legs',
    upper_lower_full: 'Upper / lower / full body',
    custom: 'Custom',
  },
  experience: { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' },
  location: { gym: 'Gym', home: 'Home', outdoor: 'Outdoor' },
  planName: '{goal} · {split}',
  planDescription: '{days} workouts per week · Level: {experience} · Location: {location} · About {minutes} min per workout.',
  copyName: '{name} (copy)',
  dayName: 'Day {n}',
  exercise: {
    oneRm: '≈{pct}% of your {lift} 1RM',
    lifts: { squat: 'squat', bench: 'bench press', deadlift: 'deadlift' },
    benchmarkReps: 'Based on your max of {max} reps',
    benchmarkSeconds: 'Based on your best hold of {max} s',
    perSide: 'Reps per side',
    perSideTime: 'Time per side',
    power: 'Explosive reps: full rest, stop before form fades',
    finisher: 'Finisher: steady, hard pace',
  },
};

const he: Strings = {
  focus: { full_body: 'כל הגוף', upper: 'פלג גוף עליון', lower: 'פלג גוף תחתון', push: 'דחיקה', pull: 'משיכה', legs: 'רגליים' },
  goal: {
    muscle_gain: 'בניית שריר',
    strength: 'חיזוק וכוח',
    general_fitness: 'כושר כללי',
    fat_loss: 'הורדת שומן',
    athletic_performance: 'ביצועים ספורטיביים',
  },
  split: {
    full_body: 'כל הגוף',
    upper_lower: 'עליון / תחתון',
    push_pull_legs: 'דחיקה / משיכה / רגליים',
    upper_lower_full: 'עליון / תחתון / כל הגוף',
    custom: 'מותאם אישית',
  },
  experience: { beginner: 'מתחילים', intermediate: 'בינונית', advanced: 'מתקדמים' },
  location: { gym: 'חדר כושר', home: 'בבית', outdoor: 'בחוץ' },
  planName: '{goal} · {split}',
  planDescription: '{days} אימונים בשבוע · רמה: {experience} · מיקום: {location} · כ-{minutes} דקות לאימון.',
  copyName: '{name} (עותק)',
  dayName: 'יום {n}',
  exercise: {
    oneRm: '≈{pct}% מה-1RM שלך ב{lift}',
    lifts: { squat: 'סקוואט', bench: 'לחיצת חזה', deadlift: 'דדליפט' },
    benchmarkReps: 'לפי המקסימום שלך: {max} חזרות',
    benchmarkSeconds: 'לפי ההחזקה הטובה שלך: {max} שניות',
    perSide: 'חזרות לכל צד',
    perSideTime: 'זמן לכל צד',
    power: 'חזרות נפיצות: מנוחה מלאה, לעצור לפני שהטכניקה נפגעת',
    finisher: 'פיניש: קצב קבוע ומאתגר',
  },
};

const STRINGS: Record<Locale, Strings> = { en, he };

export function strings(locale: Locale): Strings {
  return STRINGS[locale] ?? STRINGS.he;
}

export function fill(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in params ? String(params[k]) : m));
}

/** "Upper body A", "פלג גוף עליון B" … from a focus code such as `upper_a`. */
export function workoutNameFor(focus: string, locale: Locale): string {
  const m = /^(full_body|upper|lower|push|pull|legs)(?:_([abc]))?$/.exec(focus);
  if (!m) return strings(locale).focus.full_body;
  const base = strings(locale).focus[m[1] as FocusBase];
  return m[2] ? `${base} ${m[2].toUpperCase()}` : base;
}

/** Appends the localized "(copy)" suffix, keeping within the 120-character name limit. */
export function copyName(name: string, locale: Locale): string {
  const suffixOnly = fill(strings(locale).copyName, { name: '' });
  const room = 120 - suffixOnly.length;
  const base = name.length > room ? name.slice(0, Math.max(1, room - 1)).trimEnd() + '…' : name;
  return fill(strings(locale).copyName, { name: base });
}
