import { I18nManager, Platform } from 'react-native';

import type { Locale } from '@/data/types';
import { isRtlLocale } from '@/i18n';

/**
 * Applies the layout direction for a locale.
 *
 * Web: set `dir`/`lang` on <html>; react-native-web flips logical styles from it.
 * Native: I18nManager persists the forced direction, but a reload is required
 * for existing views to re-layout. Returns true when a restart is needed.
 */
export function syncLayoutDirection(locale: Locale): boolean {
  const rtl = isRtlLocale(locale);
  if (Platform.OS === 'web') {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('dir', rtl ? 'rtl' : 'ltr');
      document.documentElement.setAttribute('lang', locale);
    }
    return false;
  }
  if (I18nManager.isRTL === rtl) return false;
  I18nManager.allowRTL(rtl);
  I18nManager.forceRTL(rtl);
  return true;
}

/** True on native when the current layout direction does not match the locale yet. */
export function directionMismatch(locale: Locale): boolean {
  if (Platform.OS === 'web') return false;
  return I18nManager.isRTL !== isRtlLocale(locale);
}

export async function reloadApp(): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.location.reload();
    return true;
  }
  try {
    const Updates = await import('expo-updates');
    await Updates.reloadAsync();
    return true;
  } catch {
    return false;
  }
}
