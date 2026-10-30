/**
 * Phone reminders in the Android app: one-off local notifications for the next 14 days, scheduled on the
 * phone (no server). `planReminders` is pure; `createNativeReminders` applies a plan through the
 * @capacitor/local-notifications plugin (passed in, so tests use a fake).
 *
 * - Same rules as the in-app reminders (features/gamification/reminders.ts): a workout reminder on each
 *   selected weekday at `workoutTime`, meal reminders at each `mealTimes` entry. Today's are left out
 *   when already satisfied (workout done or started today; a meal logged in that meal's period).
 * - Every reminder has a fixed id from its day and slot, so a new sync replaces it instead of adding a copy;
 *   ones that are no longer wanted (settings changed, satisfied) are cancelled, and a satisfied or stale
 *   one already in the notification shade is removed.
 * - Inexact alarms only (`isExactNotification: false`): a reminder may come a few minutes late, and the
 *   app never asks for the "Alarms & reminders" special access.
 * - Never asks for permission: scheduling runs only when notifications are already allowed (the plugin
 *   would otherwise ask by itself). Permission is asked from a tap (settings), see `request`.
 */
import type { LocalNotificationSchema, LocalNotificationsPlugin, PermissionStatus } from '@capacitor/local-notifications';
import type { Locale } from '@shared/constants';
import { addDays, dayOfWeek, isValidTimeZone } from '@shared/dates';
import type { ReminderSettings } from '@shared/types';
import type { NotificationPermission, Reminders, ReminderSyncContext } from '../types';

/** Days ahead that are scheduled (each sync starts again from today). */
export const HORIZON_DAYS = 14;
/** A reminder this close to now is skipped: the plugin fires a time that has passed at once. */
export const MIN_LEAD_MS = 60_000;
export const CHANNEL_ID = 'reminders';
export const SMALL_ICON = 'ic_stat_lupufit';
export const ICON_COLOR = '#FF6A00';
/** Marks our notifications (`extra.lupufit`), so a sync never touches anything else. */
export const REMINDER_TAG = 'reminder';
/** Pages a tapped reminder may open (same as the in-app reminders). */
export const REMINDER_PATHS = { workout: '/', meal: '/nutrition/log' } as const;

export type ReminderKind = keyof typeof REMINDER_PATHS;

export interface PlannedReminder {
  id: number;
  kind: ReminderKind;
  /** The local date (YYYY-MM-DD) and time (HH:MM) it is for. */
  date: string;
  time: string;
  /** The instant it fires. */
  at: number;
}

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DAY_MS = 86_400_000;

/**
 * Stable notification id (a 32-bit int on Android): day number × 10000 + slot, where the slot is 0 for
 * the workout and 1 + HHMM for a meal. The same reminder always gets the same id (valid until 2500).
 */
export function reminderId(date: string, kind: ReminderKind, time: string): number {
  const day = Math.round(Date.parse(`${date}T00:00:00Z`) / DAY_MS);
  const m = TIME_RE.exec(time);
  const slot = kind === 'workout' ? 0 : 1 + Number(m?.[1] ?? 0) * 100 + Number(m?.[2] ?? 0);
  return day * 10_000 + slot;
}

/** The date a reminder id belongs to. */
export function reminderIdDate(id: number): string {
  return new Date(Math.floor(id / 10_000) * DAY_MS).toISOString().slice(0, 10);
}

/** Whether `id` has the shape of a reminder id (the app schedules no other notifications). */
export function isReminderId(id: unknown): id is number {
  if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0) return false;
  const day = Math.floor(id / 10_000);
  const slot = id % 10_000;
  if (day < 16_000 || day > 200_000) return false; // 2013 … 2517
  if (slot === 0) return true;
  const hhmm = slot - 1;
  return Math.floor(hhmm / 100) <= 23 && hhmm % 100 <= 59;
}

const offsetFormatters = new Map<string, Intl.DateTimeFormat>();

/** Wall clock of `timeZone` minus UTC at `instant`, in ms. */
function zoneOffset(instant: number, timeZone: string): number {
  let f = offsetFormatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    offsetFormatters.set(timeZone, f);
  }
  const parts = Object.fromEntries(f.formatToParts(new Date(instant)).map((p) => [p.type, p.value]));
  const wall = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour) % 24, Number(parts.minute), Number(parts.second));
  return wall - Math.floor(instant / 1000) * 1000;
}

/**
 * The instant at which the wall clock in `timeZone` shows `date` `time`. On a clock-change day a time that
 * happens twice gives the first one, and a time that does not exist (the hour skipped in spring) gives the
 * same wall time after the change (02:30 → 03:30), like JavaScript's own Date.
 */
export function zonedInstant(date: string, time: string, timeZone: string): number {
  const [y, mo, d] = date.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  const wall = Date.UTC(y!, mo! - 1, d!, h!, mi!);
  // The zone's offset well before and well after this wall time (any offset is within ±14 h, and clock
  // changes are months apart): the answer is `wall - offset` for whichever of the two holds there.
  const before = zoneOffset(wall - 1.5 * DAY_MS, timeZone);
  const after = zoneOffset(wall + 1.5 * DAY_MS, timeZone);
  const valid = [...new Set([before, after])].map((offset) => wall - offset).filter((instant) => zoneOffset(instant, timeZone) === wall - instant);
  // Twice (autumn): the first. Never (the hour skipped in spring): the clock time of before the change.
  return valid.length ? Math.min(...valid) : wall - before;
}

export function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/** The reminders that should be pending now (pure): the next `days` days from `ctx.today`, oldest first. */
export function planReminders(settings: ReminderSettings, ctx: ReminderSyncContext, now: number, days = HORIZON_DAYS): PlannedReminder[] {
  if (!settings.enabled) return [];
  const timeZone = ctx.timeZone && isValidTimeZone(ctx.timeZone) ? ctx.timeZone : deviceTimeZone();
  const mealTimes = settings.mealLogging ? Array.from(new Set(settings.mealTimes.filter((t) => TIME_RE.test(t)))).sort() : [];
  const workoutTime = TIME_RE.test(settings.workoutTime) ? settings.workoutTime : null;
  const out: PlannedReminder[] = [];
  const add = (kind: ReminderKind, date: string, time: string) => {
    const at = zonedInstant(date, time, timeZone);
    if (at - now < MIN_LEAD_MS) return;
    out.push({ id: reminderId(date, kind, time), kind, date, time, at });
  };
  for (let i = 0; i < days; i++) {
    const date = addDays(ctx.today, i);
    const isToday = i === 0;
    if (workoutTime && settings.workoutDays.includes(dayOfWeek(date)) && !(isToday && ctx.workoutDoneToday)) add('workout', date, workoutTime);
    for (const time of mealTimes) if (!(isToday && ctx.loggedMealTimes.includes(time))) add('meal', date, time);
  }
  return out.sort((a, b) => a.at - b.at || a.id - b.id);
}

/** Ids of today's reminders that are satisfied (workout done, meal logged): removed from the shade too. */
export function satisfiedToday(settings: ReminderSettings, ctx: ReminderSyncContext): Set<number> {
  const ids = new Set<number>();
  if (ctx.workoutDoneToday) ids.add(reminderId(ctx.today, 'workout', settings.workoutTime));
  for (const time of ctx.loggedMealTimes) if (TIME_RE.test(time)) ids.add(reminderId(ctx.today, 'meal', time));
  return ids;
}

export interface ReminderTexts {
  workout: { title: string; body: string };
  meal: { title: string; body: string };
  channel: { name: string; description: string };
}

/** The notification as handed to the plugin; `extra.sig` lets a later sync skip unchanged ones. */
export function toNotification(r: PlannedReminder, texts: ReminderTexts): LocalNotificationSchema {
  const text = texts[r.kind];
  const sig = `${r.at}|${text.title}|${text.body}`;
  return {
    id: r.id,
    title: text.title,
    body: text.body,
    schedule: { at: new Date(r.at), allowWhileIdle: true },
    channelId: CHANNEL_ID,
    smallIcon: SMALL_ICON,
    iconColor: ICON_COLOR,
    autoCancel: true,
    isExactNotification: false,
    extra: { lupufit: REMINDER_TAG, kind: r.kind, date: r.date, time: r.time, path: REMINDER_PATHS[r.kind], sig },
  };
}

interface Stored {
  id: number;
  extra?: unknown;
}

function sigOf(n: Stored | undefined): string | undefined {
  const sig = (n?.extra as { sig?: unknown } | null | undefined)?.sig;
  return typeof sig === 'string' ? sig : undefined;
}

/** The page a tapped reminder opens, or null for anything that is not one of ours. */
export function reminderPath(extra: unknown): string | null {
  const e = extra as { lupufit?: unknown; path?: unknown } | null | undefined;
  if (e?.lupufit !== REMINDER_TAG) return null;
  return Object.values(REMINDER_PATHS).find((p) => p === e.path) ?? null;
}

export function toPermission(status: PermissionStatus | undefined): NotificationPermission {
  if (status?.display === 'granted') return 'granted';
  if (status?.display === 'denied') return 'denied';
  return 'prompt';
}

export type LocalNotificationsApi = Pick<
  LocalNotificationsPlugin,
  'checkPermissions' | 'requestPermissions' | 'getPending' | 'schedule' | 'cancel' | 'getDeliveredNotifications' | 'removeDeliveredNotifications' | 'createChannel'
>;

export interface NativeRemindersOptions {
  plugin: LocalNotificationsApi;
  texts(locale: Locale): ReminderTexts;
  now?: () => number;
}

export interface SyncSummary {
  scheduled: number;
  unchanged: number;
  cancelled: number;
  removedDelivered: number;
}

/**
 * Applies a plan: cancels our stored notifications that are not in it (the plugin's list also keeps ones
 * that already fired; cancelling those just tidies its storage), schedules the new or changed ones (the
 * same id replaces the old one) and removes from the shade the ones listed in `removeShown` and anything
 * from before `today`.
 */
export async function applyPlan(
  plugin: LocalNotificationsApi,
  plan: PlannedReminder[],
  texts: ReminderTexts,
  shade: { today: string; removeShown: ReadonlySet<number> } | null,
  /** Schedule every planned one again, even unchanged ones (their alarm may be gone, e.g. after "Force stop"). */
  force = false,
): Promise<SyncSummary> {
  const wanted = new Map(plan.map((r) => [r.id, toNotification(r, texts)]));
  const stored = (await plugin.getPending()).notifications.filter((n) => isReminderId(n.id));
  const storedById = new Map<number, Stored>(stored.map((n) => [n.id, n]));

  const stale = stored.filter((n) => !wanted.has(n.id)).map((n) => ({ id: n.id }));
  if (stale.length) await plugin.cancel({ notifications: stale });

  const changed = [...wanted.values()].filter((n) => force || sigOf(storedById.get(n.id)) !== sigOf(n));
  if (changed.length) {
    await plugin.createChannel({
      id: CHANNEL_ID,
      name: texts.channel.name,
      description: texts.channel.description,
      importance: 3,
      visibility: 0,
      vibration: true,
    });
    await plugin.schedule({ notifications: changed });
  }

  // Shown already but no longer needed: today's satisfied ones, and anything from an earlier day.
  let removedDelivered = 0;
  if (shade) {
    const delivered = (await plugin.getDeliveredNotifications()).notifications.filter((n) => isReminderId(n.id));
    const remove = delivered.filter((n) => reminderIdDate(n.id) < shade.today || shade.removeShown.has(n.id));
    if (remove.length) {
      await plugin.removeDeliveredNotifications({ notifications: remove });
      removedDelivered = remove.length;
    }
  }
  return { scheduled: changed.length, unchanged: wanted.size - changed.length, cancelled: stale.length, removedDelivered };
}

export interface NativeReminders extends Reminders {
  /** The next sync schedules everything again (called when the app starts or comes back). */
  invalidate(): void;
  lastSync(): SyncSummary | null;
}

/**
 * The native `Reminders` of the platform contract. The first sync after start or `invalidate()` schedules
 * every reminder again (alarms can be gone after "Force stop" while the plugin still lists them); later
 * syncs only touch what changed.
 */
export function createNativeReminders({ plugin, texts, now = () => Date.now() }: NativeRemindersOptions): NativeReminders {
  let last: SyncSummary | null = null;
  let full = true;
  // Syncs run one after another: two overlapping ones could cancel what the other just scheduled.
  let queue: Promise<unknown> = Promise.resolve();

  const permission = async (): Promise<NotificationPermission> => {
    try {
      return toPermission(await plugin.checkPermissions());
    } catch {
      return 'denied';
    }
  };

  const sync = async (settings: ReminderSettings, ctx: ReminderSyncContext) => {
    // Without permission nothing can be shown, and scheduling would make the plugin ask by itself.
    const allowed = (await permission()) === 'granted';
    const plan = allowed ? planReminders(settings, ctx, now()) : [];
    // Without permission nothing is shown, so there is nothing to remove from the shade either.
    const shade = allowed ? { today: ctx.today, removeShown: satisfiedToday(settings, ctx) } : null;
    const force = full && allowed;
    last = await applyPlan(plugin, plan, texts(ctx.locale), shade, force);
    if (force) full = false;
  };

  return {
    supported: () => true,
    permission,
    request: async () => {
      try {
        return toPermission(await plugin.requestPermissions());
      } catch {
        return permission();
      }
    },
    sync: (settings, ctx) => {
      const run = queue.then(() => sync(settings, ctx));
      queue = run.catch(() => undefined);
      return run;
    },
    invalidate: () => {
      full = true;
    },
    lastSync: () => last,
  };
}
