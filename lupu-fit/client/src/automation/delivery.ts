/**
 * Delivery of local reminders. Nothing is sent to a server.
 * - Android (Capacitor): @capacitor/local-notifications, channel "reminders", inexact alarms (no SCHEDULE_EXACT_ALARM).
 * - Web/PWA: the Notification API while the app is open (best effort: no push server exists, so nothing fires when it is closed).
 * - Otherwise: unsupported.
 */
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { ALLOWED_ROUTES, nextFire, type ReminderKind, type Trigger } from './schedule.ts';

export type DeliveryMode = 'native' | 'web' | 'none';
export type PermState = 'granted' | 'denied' | 'prompt' | 'unsupported';
export const CHANNEL_ID = 'reminders';
export const SMALL_ICON = 'ic_stat_reminder';

export function deliveryMode(): DeliveryMode {
  try { if (Capacitor.isNativePlatform()) return 'native'; } catch { /* not a Capacitor runtime */ }
  return typeof Notification !== 'undefined' ? 'web' : 'none';
}

const norm = (v: string): PermState => (v === 'granted' ? 'granted' : v === 'denied' ? 'denied' : 'prompt');

export async function permissionState(): Promise<PermState> {
  const mode = deliveryMode();
  try {
    if (mode === 'native') return norm((await LocalNotifications.checkPermissions()).display);
    if (mode === 'web') return norm(Notification.permission === 'default' ? 'prompt' : Notification.permission);
  } catch { /* fall through */ }
  return 'unsupported';
}

/** Asks the OS only when the state is still undecided; call this from a user tap, never on start-up. */
export async function requestPermission(): Promise<PermState> {
  const cur = await permissionState();
  if (cur !== 'prompt') return cur;
  try {
    if (deliveryMode() === 'native') return norm((await LocalNotifications.requestPermissions()).display);
    const r = await Notification.requestPermission();
    return norm(r === 'default' ? 'prompt' : r);
  } catch { return 'denied'; }
}

export interface ReminderText { title: string; body: string }
export type TextFor = (kind: ReminderKind) => ReminderText;
export interface ChannelText { name: string; description: string }

let webTimers: ReturnType<typeof setTimeout>[] = [];
let webRoute: ((route: string) => void) | null = null;
const clearWeb = (): void => { webTimers.forEach(clearTimeout); webTimers = []; };

/** Replaces every pending reminder with `triggers` (idempotent: the same input yields the same pending set). */
export async function applySchedule(triggers: readonly Trigger[], textFor: TextFor, channel: ChannelText, now: Date = new Date()): Promise<void> {
  const mode = deliveryMode();
  if (mode === 'native') {
    await cancelNative();
    if (triggers.length === 0) return;
    try { await LocalNotifications.createChannel({ id: CHANNEL_ID, name: channel.name, description: channel.description, importance: 3, visibility: 0, vibration: true }); } catch { /* channel already exists */ }
    await LocalNotifications.schedule({
      notifications: triggers.map((t) => ({
        id: t.id, ...textFor(t.kind), channelId: CHANNEL_ID, smallIcon: SMALL_ICON, extra: { route: t.route },
        schedule: t.repeats
          ? { on: t.weekday === null ? { hour: t.hour, minute: t.minute } : { weekday: t.weekday + 1, hour: t.hour, minute: t.minute }, allowWhileIdle: true }
          : { at: new Date(t.at as number), allowWhileIdle: true },
      })),
    });
    return;
  }
  clearWeb();
  if (mode !== 'web' || Notification.permission !== 'granted') return;
  const horizon = now.getTime() + 24 * 3_600_000;
  for (const t of triggers) {
    const at = nextFire(t, now);
    if (!at || at.getTime() > horizon) continue;
    const text = textFor(t.kind);
    webTimers.push(setTimeout(() => {
      try { const n = new Notification(text.title, { body: text.body, tag: `lf-${t.id}` }); n.onclick = () => { window.focus(); webRoute?.(t.route); n.close(); }; } catch { /* blocked */ }
    }, Math.max(0, at.getTime() - now.getTime())));
  }
}

async function cancelNative(): Promise<void> {
  try { const { notifications } = await LocalNotifications.getPending(); if (notifications.length > 0) await LocalNotifications.cancel({ notifications: notifications.map((n) => ({ id: n.id })) }); } catch { /* nothing pending / plugin unavailable */ }
}

/** Logout, or every reminder switched off. */
export async function cancelAll(): Promise<void> {
  clearWeb();
  if (deliveryMode() === 'native') await cancelNative();
}

/** Opens a screen when a reminder is tapped (native tap, or a web notification click). Returns an unsubscribe. */
export function onReminderOpen(open: (route: string) => void): () => void {
  const safe = (route: unknown): void => { if (typeof route === 'string' && ALLOWED_ROUTES.includes(route)) open(route); };
  webRoute = safe;
  let handle: { remove: () => Promise<void> } | null = null; let gone = false;
  if (deliveryMode() === 'native') {
    void LocalNotifications.addListener('localNotificationActionPerformed', (e) => safe((e.notification.extra as { route?: unknown } | undefined)?.route))
      .then((h) => { if (gone) void h.remove(); else handle = h; }).catch(() => undefined);
  }
  return () => { gone = true; if (webRoute === safe) webRoute = null; void handle?.remove(); };
}

/** One immediate notification (rest timer end). Never prompts: only used when permission is already granted. */
export async function notifyNow(title: string, body: string): Promise<void> {
  try {
    if (deliveryMode() === 'native') {
      if ((await permissionState()) !== 'granted') return;
      await LocalNotifications.schedule({ notifications: [{ id: 900_000 + Math.floor(Date.now() % 1_000_000), title, body, smallIcon: SMALL_ICON }] });
      return;
    }
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') new Notification(title, { body });
  } catch { /* notifications are optional */ }
}
