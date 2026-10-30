/**
 * The Android app's side of the platform contract (Capacitor). Loaded only inside the app
 * (features/device/start.ts → `installNative`, when `isNativeApp()`), never in a browser or a server build.
 *
 * - saveFile: cache folder + Android share sheet (./files.ts).
 * - reminders: local notifications for the next 14 days (./reminders.ts).
 * - onResume: the app came back to the foreground (the next reminder sync then schedules everything again).
 * - Back button: close a dialog, go back, leave the app at the start page (./back.ts).
 * - A tapped reminder opens its page; the status/navigation bar icons follow the app's theme.
 */
import { App } from '@capacitor/app';
import { SystemBars, SystemBarsStyle } from '@capacitor/core';
import { Filesystem } from '@capacitor/filesystem';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Share } from '@capacitor/share';
import type { Locale } from '@shared/constants';
import { initialLocale, translate, type TKey } from '../../i18n';
import { installPlatform } from '../index';
import { backAction, closeDialog, topDialog } from './back';
import { createNativeSaveFile } from './files';
import { createNativeReminders, reminderPath, type ReminderTexts } from './reminders';

export interface NativeOptions {
  /** In-app navigation (the router). */
  navigate(path: string, options?: { replace?: boolean }): void;
}

const tr = (locale: Locale, key: TKey) => translate(locale, key) ?? translate('en', key) ?? key;

export function reminderTexts(locale: Locale): ReminderTexts {
  return {
    workout: { title: tr(locale, 'notifications.reminders.workoutTitle'), body: tr(locale, 'notifications.reminders.workoutBody') },
    meal: { title: tr(locale, 'notifications.reminders.mealTitle'), body: tr(locale, 'notifications.reminders.mealBody') },
    channel: { name: tr(locale, 'notifications.reminders.channelName'), description: tr(locale, 'notifications.reminders.channelDescription') },
  };
}

/** Chromium major version of the WebView (0 when unknown). */
export function webViewMajor(userAgent: string): number {
  const m = /Chrome\/(\d+)/.exec(userAgent);
  return m ? Number(m[1]) : 0;
}

/**
 * Bar icons follow the page theme: light icons on the dark theme, dark icons on the light one. WebView
 * before 140 cannot draw under the bars, so Capacitor pads it with the (black) window background there:
 * the icons stay light.
 */
function followTheme(): void {
  const edgeToEdge = webViewMajor(navigator.userAgent) >= 140;
  let current: string | null = null;
  const apply = () => {
    const light = edgeToEdge && document.documentElement.dataset.theme === 'light';
    const style = light ? SystemBarsStyle.Light : SystemBarsStyle.Dark;
    if (style === current) return;
    current = style;
    void SystemBars.setStyle({ style }).catch(() => undefined);
  };
  apply();
  new MutationObserver(apply).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}

export async function installNativePlatform({ navigate }: NativeOptions): Promise<void> {
  const reminders = createNativeReminders({ plugin: LocalNotifications, texts: reminderTexts });
  const resumeListeners = new Set<() => void>();

  installPlatform({
    saveFile: createNativeSaveFile({ filesystem: Filesystem, share: Share, dialogTitle: () => tr(initialLocale(), 'device.saveFile.dialogTitle') }),
    reminders,
    onResume: (listener) => {
      resumeListeners.add(listener);
      return () => resumeListeners.delete(listener);
    },
  });

  await App.addListener('resume', () => {
    // Back from the background (maybe days later, maybe after "Force stop" took the alarms): reschedule all.
    reminders.invalidate();
    for (const listener of [...resumeListeners]) listener();
  });

  await App.addListener('backButton', ({ canGoBack }) => {
    const dialog = topDialog();
    switch (backAction({ pathname: window.location.pathname, dialogOpen: dialog !== null, canGoBack })) {
      case 'close-dialog':
        if (dialog) closeDialog(dialog);
        return;
      case 'back':
        window.history.back();
        return;
      case 'home':
        navigate('/', { replace: true });
        return;
      case 'leave':
        // Like Android's own back at an app's start (Android 12+): to the home screen, the app stays ready.
        void App.minimizeApp();
        return;
    }
  });

  // A tapped reminder opens its page (also when the tap started the app: the plugin keeps the event).
  await LocalNotifications.addListener('localNotificationActionPerformed', ({ notification }) => {
    const path = reminderPath(notification.extra);
    if (path) navigate(path);
  });

  followTheme();
}
