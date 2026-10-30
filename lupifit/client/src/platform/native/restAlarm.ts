/**
 * "Rest over" during a live workout, in the Android app: a one-off local notification at the end of the
 * rest, so it arrives when the screen is off or another app is open (the WebView has no Notification API,
 * and its timers stop in the background). The web build signals by itself (features/sessions/alarm.ts).
 *
 * - One fixed id (`REST_ALARM_ID`, never a reminder id, so the reminder sync leaves it alone): a new rest
 *   replaces the previous one; skipping, changing or finishing the rest cancels it.
 * - Same channel as the reminders, inexact like them (`isExactNotification: false`, AGENTS.md: the app never
 *   asks for exact alarms), so on a dozing phone it can come a little late.
 * - Never asks for permission: without it nothing is scheduled (the plugin would ask by itself).
 */
import type { LocalNotificationSchema } from '@capacitor/local-notifications';
import type { RestAlarm } from '../types';
import { CHANNEL_ID, ICON_COLOR, SMALL_ICON, isReminderId, type LocalNotificationsApi } from './reminders';

export const REST_ALARM_ID = 7_001;
export const REST_ALARM_TAG = 'rest';

export function restNotification(at: number, texts: { title: string; body: string }): LocalNotificationSchema {
  return {
    id: REST_ALARM_ID,
    title: texts.title,
    body: texts.body,
    schedule: { at: new Date(at), allowWhileIdle: true },
    channelId: CHANNEL_ID,
    smallIcon: SMALL_ICON,
    iconColor: ICON_COLOR,
    autoCancel: true,
    isExactNotification: false,
    extra: { lupufit: REST_ALARM_TAG },
  };
}

export function createNativeRestAlarm({
  plugin,
  channel,
  now = () => Date.now(),
}: {
  plugin: Pick<LocalNotificationsApi, 'checkPermissions' | 'schedule' | 'cancel' | 'removeDeliveredNotifications' | 'createChannel'>;
  /** Name and description of the notification channel, in the app's language (created if missing). */
  channel: () => { name: string; description: string };
  now?: () => number;
}): RestAlarm {
  // Calls run one after another, so a cancel never overtakes the schedule it is meant to undo.
  let queue: Promise<unknown> = Promise.resolve();
  const run = (job: () => Promise<void>) => {
    const next = queue.then(job, job);
    queue = next.catch(() => undefined);
    return next.catch((err: unknown) => console.warn('LUPU-FIT: rest alarm', err));
  };
  const cancel = async () => {
    await plugin.cancel({ notifications: [{ id: REST_ALARM_ID }] });
    await plugin.removeDeliveredNotifications({ notifications: [{ id: REST_ALARM_ID, title: '', body: '' }] });
  };
  return {
    schedule: (at, texts) =>
      run(async () => {
        await cancel();
        if (at - now() < 1_000) return; // already over: the page signals by itself
        if ((await plugin.checkPermissions()).display !== 'granted') return;
        const names = channel();
        await plugin.createChannel({ id: CHANNEL_ID, name: names.name, description: names.description, importance: 3, visibility: 0, vibration: true });
        await plugin.schedule({ notifications: [restNotification(at, texts)] });
      }),
    cancel: () => run(cancel),
  };
}

// The rest alarm must never look like a reminder (the reminder sync cancels unknown reminder ids).
if (isReminderId(REST_ALARM_ID)) throw new Error('REST_ALARM_ID collides with the reminder ids');
