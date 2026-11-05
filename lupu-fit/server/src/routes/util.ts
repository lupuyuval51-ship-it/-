import { DAY_WINDOW, type ProfileInput } from '@lupu-fit/shared';
import type { DbAdapter } from '../db/adapter.ts';
import { ApiError, notFound } from '../core/errors.ts';
import type { Ctx } from '../core/types.ts';

export const uid = (ctx: Ctx): string => (ctx.user as NonNullable<Ctx['user']>).id;

export interface ProfileRow {
  display_name: string | null; language: 'he' | 'en'; theme: string; units: string; sex: string; age: number; height_cm: number; weight_kg: number;
  goal: string; experience: string; place: string; equipment: string[]; injuries: string[]; days_per_week: number; session_minutes: number;
  activity_level: string; diet: string; allergies: string[]; restrictions: string[]; custom_kcal: number | null; onboarded_at: string | null;
}

export function profileFromRow(r: ProfileRow): ProfileInput {
  return {
    ...(r.display_name ? { displayName: r.display_name } : {}), language: r.language, theme: r.theme as ProfileInput['theme'], units: r.units as ProfileInput['units'],
    sex: r.sex as ProfileInput['sex'], age: r.age, heightCm: r.height_cm, weightKg: r.weight_kg, goal: r.goal as ProfileInput['goal'], experience: r.experience as ProfileInput['experience'],
    place: r.place as ProfileInput['place'], equipment: r.equipment as ProfileInput['equipment'], injuries: r.injuries as ProfileInput['injuries'],
    daysPerWeek: r.days_per_week, sessionMinutes: r.session_minutes, activityLevel: r.activity_level as ProfileInput['activityLevel'],
    diet: r.diet as ProfileInput['diet'], allergies: r.allergies as ProfileInput['allergies'], restrictions: r.restrictions as ProfileInput['restrictions'],
    ...(r.custom_kcal !== null ? { customKcal: r.custom_kcal } : {}),
  };
}

export async function loadProfile(db: DbAdapter, userId: string): Promise<ProfileInput | null> {
  const r = (await db.query<ProfileRow>('SELECT * FROM profiles WHERE user_id = $1', [userId]))[0];
  return r ? profileFromRow(r) : null;
}
export async function requireProfile(db: DbAdapter, userId: string): Promise<ProfileInput> {
  const p = await loadProfile(db, userId);
  if (!p) throw notFound('profile_required');
  return p;
}

/** YYYY-MM-DD -> Date at UTC midnight and back, for pure calendar arithmetic independent of timezone. */
export const addDays = (iso: string, days: number): string => new Date(Date.parse(`${iso}T00:00:00Z`) + days * 86400_000).toISOString().slice(0, 10);
export const isoDate = (d: Date): string => d.toISOString().slice(0, 10);

/**
 * A client-chosen calendar day must be plausible against the server clock (shared DAY_WINDOW): `today` for workouts and check-ins
 * (today-1..today+1 covers every time zone), `backfill` for plain logging (up to a year back, at most one day ahead). Anything else
 * is a 400 validation error (issue message `date_out_of_range`), so far-past or far-future dates can neither mint rewards nor feed trends and the coach.
 */
export function assertPlausibleDay(ctx: Ctx, day: string, kind: 'today' | 'backfill', field = 'date'): void {
  const today = isoDate(ctx.now);
  const earliest = addDays(today, -(kind === 'today' ? DAY_WINDOW.pastDaysToday : DAY_WINDOW.backfillDays));
  const latest = addDays(today, DAY_WINDOW.futureDays);
  if (day < earliest || day > latest) throw new ApiError(400, 'validation_error', { issues: [{ path: field, message: 'date_out_of_range' }], earliest, latest });
}
