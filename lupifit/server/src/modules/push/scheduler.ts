/**
 * Reminder job for phone notifications. Every minute (in-process timer, started by the server
 * entry outside tests) it looks at users who turned reminders on and have at least one device:
 * - Workout reminder on each of `workoutDays` at `workoutTime` (user's time zone), unless a
 *   workout was already completed today or one is in progress.
 * - Meal-logging reminders at each of `mealTimes` when `mealLogging` is on, unless something
 *   was added to today's food log in the last 3 hours.
 * A reminder goes out from its time until 10 minutes later (never early; a missed tick is
 * tolerated) and at most once per slot and day: the slot is claimed in `push_deliveries` first.
 * `dueReminders` is pure; `runReminderTick` does one pass and is what the tests drive.
 */
import type { Locale } from '@shared/constants';
import { addDays, dateInTimeZone, dayOfWeek, isValidTimeZone } from '@shared/dates';
import { remindersSchema } from '@shared/schemas/profile';
import type { ReminderSettings } from '@shared/types';
import { config } from '../../config';
import { db, type Sql } from '../../db/pool';
import { DEFAULT_REMINDERS } from '../profile/repository';
import { listSubscriptions } from './repository';
import { sendToSubscriptions } from './sender';
import { pushPayload } from './texts';
import { vapidProblem } from './vapid';

export const REMINDER_WINDOW_MINUTES = 10;
export const MEAL_LOOKBACK_HOURS = 3;
/** A reminder that reaches a phone hours late is noise; the push service drops it after this. */
const REMINDER_TTL_SECONDS = 2 * 60 * 60;
const USER_CONCURRENCY = 8;

export interface LocalClock {
  /** YYYY-MM-DD */
  date: string;
  /** Minutes since local midnight. */
  minutes: number;
}

const formatters = new Map<string, Intl.DateTimeFormat>();

/** Wall-clock date and time in `timeZone` (unknown zones fall back to UTC). */
export function localClock(now: Date, timeZone: string): LocalClock {
  const tz = isValidTimeZone(timeZone) ? timeZone : 'UTC';
  let f = formatters.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
    formatters.set(tz, f);
  }
  const parts = f.formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '0';
  return { date: `${get('year')}-${get('month')}-${get('day')}`, minutes: (Number(get('hour')) % 24) * 60 + Number(get('minute')) };
}

function toMinutes(hhmm: string): number | null {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hhmm);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

export type ReminderKind = 'workout' | 'meal';

export interface DueReminder {
  kind: ReminderKind;
  /** HH:MM the reminder was set for. */
  slot: string;
  /** The user's calendar day the slot belongs to (the day before, just after midnight). */
  localDate: string;
}

/**
 * Reminders whose time came within the last `windowMinutes` (pure). Nothing is due before its
 * time; just after midnight a slot from late the previous evening still counts for that day.
 */
export function dueReminders(settings: ReminderSettings, now: Date, timeZone: string, windowMinutes = REMINDER_WINDOW_MINUTES): DueReminder[] {
  if (!settings.enabled) return [];
  const clock = localClock(now, timeZone);
  const out: DueReminder[] = [];
  const consider = (kind: ReminderKind, slot: string, weekdays?: number[]) => {
    const at = toMinutes(slot);
    if (at == null) return;
    const elapsed = (clock.minutes - at + 24 * 60) % (24 * 60);
    if (elapsed >= windowMinutes) return;
    const localDate = elapsed > clock.minutes ? addDays(clock.date, -1) : clock.date;
    if (weekdays && !weekdays.includes(dayOfWeek(localDate))) return;
    out.push({ kind, slot, localDate });
  };
  consider('workout', settings.workoutTime, settings.workoutDays);
  if (settings.mealLogging) for (const time of new Set(settings.mealTimes)) consider('meal', time);
  return out;
}

/** Stored reminder settings, or null when the row is unusable (never throws). */
function parseSettings(raw: unknown): ReminderSettings | null {
  const parsed = remindersSchema.safeParse({ ...DEFAULT_REMINDERS, ...(raw && typeof raw === 'object' ? raw : {}) });
  return parsed.success ? parsed.data : null;
}

/** True when a workout was completed on `localDate`, or one started that day is still open. */
async function trainedOrTraining(sql: Sql, userId: string, timeZone: string, localDate: string, now: Date): Promise<boolean> {
  const rows = await sql.many<{ status: string; started_at: Date; ended_at: Date | null }>(
    `SELECT status, started_at, ended_at FROM workout_sessions
      WHERE user_id = $1
        AND (status IN ('in_progress', 'paused')
             OR (status = 'completed' AND COALESCE(ended_at, started_at) > $2::timestamptz - interval '2 days'))`,
    [userId, now],
  );
  return rows.some((r) =>
    r.status === 'completed' ? dateInTimeZone(r.ended_at ?? r.started_at, timeZone) === localDate : dateInTimeZone(r.started_at, timeZone) === localDate,
  );
}

/** True when something was added to the day's food log in the last few hours. */
async function loggedRecently(sql: Sql, userId: string, localDate: string, now: Date): Promise<boolean> {
  const row = await sql.maybeOne(
    `SELECT 1 FROM food_log_entries
      WHERE user_id = $1 AND logged_on = $2 AND created_at > $3::timestamptz - make_interval(hours => $4)
      LIMIT 1`,
    [userId, localDate, now, MEAL_LOOKBACK_HOURS],
  );
  return row !== null;
}

interface CandidateRow {
  id: string;
  locale: Locale;
  timezone: string;
  reminders: unknown;
}

export interface TickSummary {
  /** Users with reminders on and at least one device. */
  users: number;
  sent: number;
  skipped: number;
  failed: number;
}

async function remindUser(sql: Sql, user: CandidateRow, now: Date, summary: TickSummary): Promise<void> {
  const settings = parseSettings(user.reminders);
  if (!settings) return;
  for (const due of dueReminders(settings, now, user.timezone)) {
    // Claim the slot first: a second tick (or another instance) can then never send it again.
    const claimed = await sql.maybeOne(
      `INSERT INTO push_deliveries (user_id, kind, local_date, slot, status) VALUES ($1, $2, $3, $4, 'pending')
       ON CONFLICT DO NOTHING RETURNING 1`,
      [user.id, due.kind, due.localDate, due.slot],
    );
    if (!claimed) continue;
    const skip =
      due.kind === 'workout'
        ? await trainedOrTraining(sql, user.id, user.timezone, due.localDate, now)
        : await loggedRecently(sql, user.id, due.localDate, now);
    let status: 'sent' | 'skipped' | 'failed' = 'skipped';
    let sentCount = 0;
    if (!skip) {
      const subscriptions = await listSubscriptions(sql, user.id);
      const result = subscriptions.length
        ? await sendToSubscriptions(sql, subscriptions, pushPayload(due.kind, user.locale, due.slot), {
            ttlSeconds: REMINDER_TTL_SECONDS,
            urgency: 'normal',
            topic: due.kind,
          })
        : { sent: 0, failed: 0, removed: 0 };
      sentCount = result.sent;
      status = result.sent > 0 ? 'sent' : 'failed';
    }
    summary[status] += 1;
    await sql.exec(
      'UPDATE push_deliveries SET status = $5, sent_count = $6 WHERE user_id = $1 AND kind = $2 AND local_date = $3 AND slot = $4',
      [user.id, due.kind, due.localDate, due.slot, status, sentCount],
    );
  }
}

/** One pass of the reminder job. Does nothing when push is not configured. */
export async function runReminderTick(sql: Sql = db, now: Date = new Date()): Promise<TickSummary> {
  const summary: TickSummary = { users: 0, sent: 0, skipped: 0, failed: 0 };
  if (vapidProblem()) return summary;
  const users = await sql.many<CandidateRow>(
    `SELECT u.id, u.locale, u.timezone, p.reminders
       FROM users u JOIN profiles p ON p.user_id = u.id
      WHERE p.reminders @> '{"enabled": true}'::jsonb
        AND EXISTS (SELECT 1 FROM push_subscriptions s WHERE s.user_id = u.id)
      ORDER BY u.id`,
  );
  summary.users = users.length;
  let next = 0;
  const worker = async () => {
    while (next < users.length) {
      const user = users[next++]!;
      try {
        await remindUser(sql, user, now, summary);
      } catch (err) {
        console.error('[push] reminder failed for one user:', (err as Error).message);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(USER_CONCURRENCY, users.length) }, worker));
  return summary;
}

/**
 * Starts the reminder job (called by the server entry, never in tests). Returns a stop function.
 * Without VAPID keys it only logs why phone notifications are off.
 */
export function startReminderScheduler(): () => void {
  const problem = vapidProblem();
  if (problem) {
    console.log(`[push] phone notifications disabled: ${problem}`);
    return () => undefined;
  }
  let running = false;
  const tick = async () => {
    if (running) return; // a slow pass (many users) never overlaps the next one
    running = true;
    try {
      await runReminderTick(db, new Date());
    } catch (err) {
      console.error('[push] reminder job failed:', (err as Error).message);
    } finally {
      running = false;
    }
  };
  const timer = setInterval(() => void tick(), config.push.schedulerIntervalMs);
  timer.unref();
  void tick();
  console.log('[push] phone notifications enabled, reminder job started');
  return () => clearInterval(timer);
}
