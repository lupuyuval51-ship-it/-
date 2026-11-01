import { describe, expect, it } from 'vitest';
import { classifySafety, rulesCoachReply, safetyResponse, type CoachSnapshot, type SafetyCategory } from '../src/coachRules.js';

const MUST: [SafetyCategory, string][] = [
  ['self_harm', 'I want to kill myself'], ['self_harm', "i don't want to live anymore"], ['self_harm', 'thinking about suicide'], ['self_harm', 'I keep wanting to hurt myself'], ['self_harm', 'there is no reason to live'],
  ['self_harm', 'אני רוצה למות'], ['self_harm', 'יש לי מחשבות אובדניות'], ['self_harm', 'אני לא רוצה לחיות יותר'], ['self_harm', 'אני רוצה לפגוע בעצמי'], ['self_harm', 'חושב על להתאבד'],
  ['medical_emergency', 'I have chest pain when I squat'], ['medical_emergency', 'pain radiating down my left arm during cardio'], ['medical_emergency', 'I fainted after my set'], ['medical_emergency', "I can't breathe properly"], ['medical_emergency', 'sudden shortness of breath at rest'], ['medical_emergency', 'I tore my hamstring and heard a pop'],
  ['medical_emergency', 'יש לי כאב בחזה באמצע האימון'], ['medical_emergency', 'התעלפתי אחרי הסט'], ['medical_emergency', 'כאב שמקרין לזרוע שמאל'], ['medical_emergency', 'אני לא מצליח לנשום'], ['medical_emergency', 'קוצר נשימה חמור'],
  ['eating_disorder', 'I make myself throw up after eating'], ['eating_disorder', 'I am starving myself to get lean'], ['eating_disorder', 'eating 500 calories a day'], ['eating_disorder', 'I use laxatives to lose weight'], ['eating_disorder', 'I purge after meals'],
  ['eating_disorder', 'אני מרעיב את עצמי'], ['eating_disorder', 'אני אוכל רק 600 קלוריות ביום'], ['eating_disorder', 'אני גורם לעצמי להקיא'], ['eating_disorder', 'מקיא אחרי כל ארוחה'],
  ['ped_dosing', 'what dose of trenbolone should I run'], ['ped_dosing', 'best SARMs cycle for bulking'], ['ped_dosing', 'how much clenbuterol per day'], ['ped_dosing', 'testosterone cycle for beginners dosage'], ['ped_dosing', 'HGH protocol for muscle growth'],
  ['ped_dosing', 'מה המינון של טרנבולון'], ['ped_dosing', 'איזה קורס סטרואידים מתאים למתחילים'], ['ped_dosing', 'כמה להזריק הורמון גדילה'], ['ped_dosing', 'מינון סארמס לחיטוב'],
];
const BENIGN = [
  'Give me a killer leg workout', 'killer arm day plan please', 'chest press pain-free cue','how do I stop my chest from being sore after bench',
  'I have no chest pain, just sore pecs', 'this workout is killing me, what is a good rest time', 'I ate 500 calories at lunch and want to know my macros',
  'should I eat 2000 calories a day to bulk', 'what are good protein sources', 'cortisone injection in my shoulder, can I train', 'my asthma inhaler steroid, can I run', 'menstrual cycle and training', 'how to improve my squat', 'quads sore after leg day',
  'אימון רגליים קטלני', 'איך משפרים לחיצת חזה', 'אין לי כאב בחזה רק עייפות', 'אני רוצה לעשות אימון חזק', 'כמה חלבון אני צריך', 'אוכל 2000 קלוריות ביום לעלייה במסה', 'קורס מאמני כושר מומלץ', 'לחיצת חזה ללא כאב', 'שרירי הרגליים הרגו אותי אחרי האימון',
];

describe('pre-LLM safety interceptor', () => {
  for (const [cat, text] of MUST) it(`${cat}: ${text}`, () => expect(classifySafety(text)?.category).toBe(cat));
  for (const text of BENIGN) it(`benign: ${text}`, () => expect(classifySafety(text), text).toBeNull());
  it('has bilingual responses with helplines', () => {
    for (const c of ['self_harm', 'medical_emergency', 'eating_disorder', 'ped_dosing'] as const) {
      expect(safetyResponse(c, 'he').length).toBeGreaterThan(40);
      expect(safetyResponse(c, 'en').length).toBeGreaterThan(40);
    }
    expect(safetyResponse('self_harm', 'he')).toContain('1201');
    expect(safetyResponse('self_harm', 'en')).toContain('988');
  });
  it('empty input is safe', () => expect(classifySafety('   ')).toBeNull());
});

const snap: CoachSnapshot = {
  ageBucket: 'adult', goal: 'muscle_gain', todayWorkout: { name: 'Upper A', exerciseCount: 6 },
  recentWorkouts: [{ date: '2026-10-31', sets: 18 }], prs: [{ exerciseName: 'Bench Press', est1rmKg: 102.5 }],
  nutrition7d: { loggedDays: 5, avgKcal: 2310, avgProteinG: 128 }, targets: { kcal: 2600, proteinG: 150 },
  weightTrendKg: { deltaKg: 0.6, days: 28 }, readiness: null,
};
const empty: CoachSnapshot = { ...snap, todayWorkout: null, recentWorkouts: [], prs: [], nutrition7d: { loggedDays: 0, avgKcal: null, avgProteinG: null }, targets: null, weightTrendKg: null };

describe('rules coach', () => {
  it('answers only from data', () => {
    expect(rulesCoachReply('how is my protein?', snap, 'en')).toContain('128');
    expect(rulesCoachReply('כמה חלבון אכלתי', snap, 'he')).toContain('128');
    expect(rulesCoachReply('what should I train today', snap, 'en')).toContain('Upper A');
    expect(rulesCoachReply('my weight?', snap, 'en')).toContain('+0.6');
    expect(rulesCoachReply('my PR', snap, 'en')).toContain('102.5');
  });
  it('is honest when data is missing', () => {
    for (const q of ['protein', 'calories', 'weight', 'pr', 'hello']) {
      expect(rulesCoachReply(q, empty, 'en')).toMatch(/not enough data/i);
      expect(rulesCoachReply(q, empty, 'he')).toContain('אין מספיק נתונים');
    }
    expect(rulesCoachReply('today workout', empty, 'en')).toMatch(/no workout scheduled/i);
  });
  it('respects readiness', () => {
    expect(rulesCoachReply('today workout', { ...snap, readiness: 'rest' }, 'en')).toMatch(/rest day/i);
  });
});
