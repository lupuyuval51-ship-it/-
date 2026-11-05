import { useEffect, useRef } from 'react';
import { useLocale } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { useProfile, useUpdateProfile } from './api';

/**
 * Keeps the device preferences (language, theme) and the account profile in sync:
 * - a choice made on this device (pending sync) is pushed to `profiles.locale` / `profiles.theme`;
 * - otherwise the account's preference is adopted (e.g. signing in on a new device).
 * Renders nothing. Mounted once inside the auth + query providers.
 */
export function PreferencesSync() {
  const profile = useProfile();
  const updateProfile = useUpdateProfile();
  const { locale, setLocale, pendingProfileSync: localePending, markProfileSynced: markLocaleSynced } = useLocale();
  const { preference, setPreference, pendingProfileSync: themePending, markProfileSynced: markThemeSynced } = useTheme();
  const inFlight = useRef(false);
  const data = profile.data;
  const { mutateAsync } = updateProfile;

  useEffect(() => {
    if (!data || inFlight.current) return;
    const patch: { locale?: typeof locale; theme?: typeof preference } = {};
    if (localePending && data.locale !== locale) patch.locale = locale;
    if (themePending && data.theme !== preference) patch.theme = preference;

    if (localePending && data.locale === locale) markLocaleSynced();
    if (themePending && data.theme === preference) markThemeSynced();

    if (patch.locale || patch.theme) {
      inFlight.current = true;
      mutateAsync(patch)
        .then(() => {
          if (patch.locale) markLocaleSynced();
          if (patch.theme) markThemeSynced();
        })
        .catch(() => undefined) // stays pending; retried on the next profile refresh
        .finally(() => {
          inFlight.current = false;
        });
      return;
    }

    if (!localePending && data.locale !== locale) void setLocale(data.locale, { source: 'profile' });
    if (!themePending && data.theme !== preference) setPreference(data.theme, { source: 'profile' });
  }, [data, locale, preference, localePending, themePending, mutateAsync, setLocale, setPreference, markLocaleSynced, markThemeSynced]);

  return null;
}
