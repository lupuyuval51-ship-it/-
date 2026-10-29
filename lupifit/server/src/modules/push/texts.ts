/**
 * Notification texts, in the account language (`users.locale`). The reminder texts match the
 * in-app reminders (client `notifications.reminders.*`) and so does the tag, so a push and an
 * in-app notification for the same reminder replace each other instead of stacking up.
 * Short, neutral wording (no gendered Hebrew, nothing about weight or calories).
 */
import type { Locale } from '@shared/constants';
import type { PushPayload } from '@shared/types';

export type PushKind = 'workout' | 'meal' | 'test';

const TEXTS: Record<Locale, Record<PushKind, { title: string; body: string }>> = {
  en: {
    workout: { title: 'Time to train', body: "It's one of your workout days — your next session is waiting." },
    meal: { title: 'Time to log your meal', body: 'Logging now keeps your nutrition on track.' },
    test: { title: 'LUPU-FIT test notification', body: 'Phone notifications work on this device.' },
  },
  he: {
    workout: { title: 'זמן להתאמן', body: 'היום הוא אחד מימי האימון שלך — האימון הבא מחכה.' },
    meal: { title: 'זמן לתעד ארוחה', body: 'תיעוד עכשיו עוזר לשמור על התזונה במסלול.' },
    test: { title: 'התראת בדיקה מ-LUPU-FIT', body: 'ההתראות לטלפון עובדות במכשיר הזה.' },
  },
};

/** Page opened when the notification is tapped (the service worker accepts only these). */
export const PUSH_PATHS: Record<PushKind, string> = {
  workout: '/workouts',
  meal: '/nutrition/log',
  test: '/profile',
};

export function pushPayload(kind: PushKind, locale: Locale, slot?: string): PushPayload {
  const lang: Locale = locale === 'en' ? 'en' : 'he';
  const text = TEXTS[lang][kind];
  const tag = kind === 'workout' ? 'fitai-workout' : kind === 'meal' ? `fitai-meal:${slot ?? ''}` : 'fitai-push-test';
  return { title: text.title, body: text.body, url: PUSH_PATHS[kind], tag, lang };
}
