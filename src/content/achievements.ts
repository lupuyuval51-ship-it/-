/**
 * Achievement definitions. Every achievement is unlocked from recorded data only (see src/engine/achievements.ts).
 * `icon` is a lucide icon name.
 */
import type { AchievementDefinition } from "@/lib/types";

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: "first_session",
    title: { he: "האימון הראשון", en: "First workout" },
    description: { he: "השלמתם את האימון הראשון שלכם ב-DiscCoach.", en: "You completed your first DiscCoach workout." },
    icon: "flag",
    xp: 30,
    condition: { kind: "first_session" },
  },
  {
    id: "throws_100",
    title: { he: "100 זריקות", en: "100 throws" },
    description: { he: "100 זריקות נרשמו באימונים שלכם.", en: "100 throws logged across your workouts." },
    icon: "disc",
    xp: 25,
    condition: { kind: "throws", count: 100 },
  },
  {
    id: "throws_500",
    title: { he: "500 זריקות", en: "500 throws" },
    description: { he: "500 זריקות נרשמו באימונים שלכם.", en: "500 throws logged across your workouts." },
    icon: "disc",
    xp: 50,
    condition: { kind: "throws", count: 500 },
  },
  {
    id: "throws_1000",
    title: { he: "1,000 זריקות", en: "1,000 throws" },
    description: { he: "1,000 זריקות – היד כבר יודעת את הדרך.", en: "1,000 throws – the hand knows the way by now." },
    icon: "sparkles",
    xp: 100,
    condition: { kind: "throws", count: 1000 },
  },
  {
    id: "sessions_10",
    title: { he: "10 אימונים", en: "10 workouts" },
    description: { he: "השלמתם 10 אימונים.", en: "You completed 10 workouts." },
    icon: "calendar-check",
    xp: 60,
    condition: { kind: "sessions", count: 10 },
  },
  {
    id: "sessions_50",
    title: { he: "50 אימונים", en: "50 workouts" },
    description: { he: "השלמתם 50 אימונים – התמדה אמיתית.", en: "You completed 50 workouts – real consistency." },
    icon: "trophy",
    xp: 150,
    condition: { kind: "sessions", count: 50 },
  },
  {
    id: "hours_10",
    title: { he: "10 שעות אימון", en: "10 training hours" },
    description: { he: "צברתם 10 שעות של אימון פעיל.", en: "You logged 10 hours of active training." },
    icon: "clock",
    xp: 60,
    condition: { kind: "hours", count: 10 },
  },
  {
    id: "hours_50",
    title: { he: "50 שעות אימון", en: "50 training hours" },
    description: { he: "צברתם 50 שעות של אימון פעיל.", en: "You logged 50 hours of active training." },
    icon: "timer",
    xp: 150,
    condition: { kind: "hours", count: 50 },
  },
  {
    id: "streak_7",
    title: { he: "רצף של 7", en: "7-workout streak" },
    description: { he: "7 אימונים ברצף בלי לשבור את הרצף.", en: "7 workouts in a row without breaking the streak." },
    icon: "flame",
    xp: 80,
    condition: { kind: "streak_days", count: 7 },
  },
  {
    id: "accuracy_master",
    title: { he: "מאסטר דיוק", en: "Accuracy master" },
    description: { he: "דיוק זריקה של 80% ומעלה על פני 100 זריקות לפחות.", en: "80%+ throw accuracy over at least 100 attempts." },
    icon: "target",
    xp: 100,
    condition: { kind: "accuracy", key: "throw_accuracy", pct: 80, minAttempts: 100 },
  },
  {
    id: "backhand_master",
    title: { he: "מאסטר Backhand", en: "Backhand master" },
    description: { he: "דיוק Backhand של 80% ומעלה על פני 100 זריקות לפחות.", en: "80%+ backhand accuracy over at least 100 attempts." },
    icon: "crosshair",
    xp: 80,
    condition: { kind: "accuracy", key: "backhand_accuracy", pct: 80, minAttempts: 100 },
  },
  {
    id: "forehand_master",
    title: { he: "מאסטר Forehand", en: "Forehand master" },
    description: { he: "דיוק Forehand של 80% ומעלה על פני 100 זריקות לפחות.", en: "80%+ forehand accuracy over at least 100 attempts." },
    icon: "crosshair",
    xp: 80,
    condition: { kind: "accuracy", key: "forehand_accuracy", pct: 80, minAttempts: 100 },
  },
  {
    id: "wing_challenge",
    title: { he: "אתגר הכנף", en: "Wing challenge" },
    description: { he: "השלמתם את אתגר הכנף ורשמתם ציון.", en: "You completed the wing challenge and logged a score." },
    icon: "wind",
    xp: 50,
    condition: { kind: "role_challenge", role: "wing" },
  },
  {
    id: "runner_challenge",
    title: { he: "אתגר הרץ", en: "Runner challenge" },
    description: { he: "השלמתם את אתגר הרץ ורשמתם ציון.", en: "You completed the runner challenge and logged a score." },
    icon: "footprints",
    xp: 50,
    condition: { kind: "role_challenge", role: "runner" },
  },
  {
    id: "defender_challenge",
    title: { he: "אתגר המגן", en: "Defender challenge" },
    description: { he: "השלמתם את אתגר המגן ורשמתם ציון.", en: "You completed the defender challenge and logged a score." },
    icon: "shield",
    xp: 50,
    condition: { kind: "role_challenge", role: "defender" },
  },
  {
    id: "handler_challenge",
    title: { he: "אתגר ה-Handler", en: "Handler challenge" },
    description: { he: "השלמתם את אתגר ה-Handler ורשמתם ציון.", en: "You completed the handler challenge and logged a score." },
    icon: "hand",
    xp: 50,
    condition: { kind: "role_challenge", role: "handler" },
  },
  {
    id: "cutter_challenge",
    title: { he: "אתגר ה-Cutter", en: "Cutter challenge" },
    description: { he: "השלמתם את אתגר ה-Cutter ורשמתם ציון.", en: "You completed the cutter challenge and logged a score." },
    icon: "zap",
    xp: 50,
    condition: { kind: "role_challenge", role: "cutter" },
  },
  {
    id: "distance_pb",
    title: { he: "שיא מרחק", en: "Distance PB" },
    description: { he: "שברתם את שיא הזריקה הארוכה שלכם.", en: "You beat your own longest-throw record." },
    icon: "ruler",
    xp: 40,
    condition: { kind: "personal_best", key: "longest_throw_m" },
  },
  {
    id: "catches_100",
    title: { he: "100 תפיסות", en: "100 catches" },
    description: { he: "100 תפיסות נרשמו באימונים שלכם.", en: "100 catches logged across your workouts." },
    icon: "hand",
    xp: 25,
    condition: { kind: "catches", count: 100 },
  },
];

export const ACHIEVEMENT_MAP: Record<string, AchievementDefinition> = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));

export function getAchievement(id: string): AchievementDefinition | undefined {
  return ACHIEVEMENT_MAP[id];
}
