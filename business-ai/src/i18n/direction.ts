/**
 * Layout direction management (docs/ARCHITECTURE.md §7.4).
 *
 * Native: I18nManager drives layout and only changes after a JS reload. When the stored locale's
 * direction differs from `I18nManager.isRTL`, we force the new direction and reload — exactly once
 * per target locale (a persisted guard prevents reload loops if the platform ignores forceRTL).
 * Web: `document.documentElement.dir/lang` plus a `dir` on the root view (see DirectionRoot).
 */
import { reloadAppAsync } from 'expo';
import { I18nManager, Platform } from 'react-native';
import { readString, removeKey, STORAGE_KEYS, writeString } from '@/lib/storage';
import { isRTLLocale, type Locale } from './types';

export type DirectionAction = 'none' | 'reload' | 'give-up';

/**
 * Pure decision used on cold start.
 * - directions match → 'none'
 * - mismatch and we already reloaded for this locale → 'give-up' (never loop)
 * - mismatch → 'reload'
 */
export function resolveDirectionAction(input: { locale: Locale; nativeIsRTL: boolean; guard: string | null }): DirectionAction {
  if (isRTLLocale(input.locale) === input.nativeIsRTL) return 'none';
  if (input.guard === input.locale) return 'give-up';
  return 'reload';
}

/** True when changing to `next` requires a native reload. Always false on web. */
export function directionChangeRequiresReload(next: Locale): boolean {
  return Platform.OS !== 'web' && isRTLLocale(next) !== I18nManager.isRTL;
}

async function forceDirectionAndReload(locale: Locale): Promise<void> {
  await writeString(STORAGE_KEYS.localeReloadGuard, locale);
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(isRTLLocale(locale));
  await reloadAppAsync(`Layout direction changed for locale "${locale}"`);
}

/**
 * Cold-start reconciliation (native only). Resolves 'reloading' when a reload was triggered —
 * the caller must keep the splash screen up and render nothing.
 */
export async function reconcileNativeDirection(locale: Locale): Promise<'ok' | 'reloading'> {
  if (Platform.OS === 'web') return 'ok';
  const guard = await readString(STORAGE_KEYS.localeReloadGuard);
  const action = resolveDirectionAction({ locale, nativeIsRTL: I18nManager.isRTL, guard });
  if (action === 'reload') {
    try {
      await forceDirectionAndReload(locale);
      return 'reloading';
    } catch {
      return 'ok';
    }
  }
  if (action === 'give-up' && __DEV__) {
    console.warn(`[i18n] Layout direction did not change after reload for "${locale}"; continuing without reloading again.`);
  }
  if (guard !== null) await removeKey(STORAGE_KEYS.localeReloadGuard);
  return 'ok';
}

/** Applies a user-initiated locale change on native; reloads only when the direction changes. */
export async function applyNativeLocaleDirection(locale: Locale): Promise<'unchanged' | 'reloading'> {
  if (!directionChangeRequiresReload(locale)) return 'unchanged';
  await forceDirectionAndReload(locale);
  return 'reloading';
}

/** Web: reflect the locale on <html> for CSS, screen readers and browser features. */
export function applyWebDocumentLocale(locale: Locale): void {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  const root = document.documentElement;
  root.lang = locale;
  root.dir = isRTLLocale(locale) ? 'rtl' : 'ltr';
}

/** The layout direction actually in effect: locale-driven on web, I18nManager-driven on native. */
export function effectiveIsRTL(locale: Locale): boolean {
  return Platform.OS === 'web' ? isRTLLocale(locale) : I18nManager.isRTL;
}
