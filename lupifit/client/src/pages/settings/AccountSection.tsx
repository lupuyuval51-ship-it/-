/** Account & preferences: display name, language, theme, units and time zone (PATCH /api/settings). */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useRef, useState } from 'react';
import { LOCALES, THEMES, UNITS, type Locale, type Theme, type Units } from '@shared/constants';
import { settingsUpdateSchema, type SettingsUpdateInput } from '@shared/schemas/profile';
import type { UserDTO } from '@shared/types';
import { ApiError } from '../../api/client';
import { useAuth } from '../../auth/AuthProvider';
import { Button, Segmented, SelectField, TextField, useToast } from '../../components/ui';
import { applyProfileChange, updateSettings } from '../../features/profile/api';
import { changedFields, firstInvalidField, validate } from '../../features/profile/draft';
import { FieldSlot } from '../../features/profile/fields';
import { focusField, localizeIssues, serverFieldErrors, type FieldErrors } from '../../features/profile/validation';
import { useI18n, translate } from '../../i18n';
import { browserTimeZone } from '../../lib/dates';
import { errorMessage } from '../../lib/errors';
import { isDeviceMode } from '../../platform';
import { SectionCard, useSectionForm } from './sectionForm';

/** Used when the browser cannot list its supported time zones. */
const FALLBACK_TIME_ZONES = [
  'UTC',
  'Asia/Jerusalem',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Moscow',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland',
  'America/Sao_Paulo',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Pacific/Honolulu',
];

export function timeZoneOptions(current: string): string[] {
  let zones: string[] = [];
  try {
    const intl = Intl as typeof Intl & { supportedValuesOf?: (key: string) => string[] };
    zones = intl.supportedValuesOf?.('timeZone') ?? [];
  } catch {
    zones = [];
  }
  if (zones.length === 0) zones = FALLBACK_TIME_ZONES;
  const all = new Set(['UTC', ...zones, current]);
  return [...all].sort((a, b) => (a === 'UTC' ? -1 : b === 'UTC' ? 1 : a.localeCompare(b)));
}

interface AccountValues {
  displayName: string;
  locale: Locale;
  theme: Theme;
  units: Units;
  timezone: string;
}

const KEYS = ['displayName', 'locale', 'theme', 'units', 'timezone'] as const;
const schema = settingsUpdateSchema.pick({ displayName: true, locale: true, theme: true, units: true, timezone: true });

export function AccountSection({ user }: { user: UserDTO }) {
  const i18n = useI18n();
  const { t, setLocale } = i18n;
  const { setUser } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const source = useMemo<AccountValues>(
    () => ({ displayName: user.displayName, locale: user.locale, theme: user.theme, units: user.units, timezone: user.timezone }),
    [user.displayName, user.locale, user.theme, user.units, user.timezone],
  );
  const form = useSectionForm('account', source);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const zones = useMemo(() => timeZoneOptions(form.values.timezone), [form.values.timezone]);
  const deviceZone = browserTimeZone();

  const mutation = useMutation({
    mutationFn: ({ changes }: { changes: SettingsUpdateInput; submitted: AccountValues }) => updateSettings(changes),
    onSuccess: async (res, { submitted }) => {
      const next = res.user;
      form.commit({ displayName: next.displayName, locale: next.locale, theme: next.theme, units: next.units, timezone: next.timezone }, submitted);
      setUser(next);
      setLocale(next.locale);
      toast.success(translate(next.locale, 'settings.saved') ?? t('settings.saved'));
      await applyProfileChange(queryClient, res.profile);
    },
    onError: (err) => {
      if (err instanceof ApiError && err.code === 'validation_error') setErrors(serverFieldErrors(err.details, i18n));
      setFormError(errorMessage(err, i18n, 'settings'));
    },
  });

  const onSubmit = () => {
    setFormError(null);
    const result = validate(schema, form.values);
    if (!result.ok) {
      setErrors(localizeIssues(result.issues, i18n, false));
      focusField(firstInvalidField(KEYS, result.issues), formRef.current ?? document);
      return;
    }
    setErrors({});
    mutation.mutate({ changes: changedFields(result.data as AccountValues, form.base), submitted: form.values });
  };

  return (
    <SectionCard
      id="settings-account"
      title={t(isDeviceMode ? 'device.settings.preferencesTitle' : 'settings.account.title')}
      subtitle={t(isDeviceMode ? 'device.settings.preferencesSubtitle' : 'settings.account.subtitle')}
      dirty={form.dirty}
      saving={mutation.isPending}
      error={formError}
      formRef={formRef}
      onSubmit={onSubmit}
      onDiscard={() => {
        form.reset();
        setErrors({});
        setFormError(null);
      }}
    >
      <div className="grid-2">
        <FieldSlot name="displayName">
          <TextField
            label={t('settings.account.displayName')}
            value={form.values.displayName}
            onChange={(e) => form.set({ displayName: e.target.value })}
            maxLength={60}
            autoComplete="nickname"
            required
            error={errors.displayName}
            name="displayName"
          />
        </FieldSlot>
        {/* Device mode: the hidden device account's address is not the person's; there is nothing to show. */}
        {!isDeviceMode && <TextField label={t('settings.account.email')} value={user.email} readOnly dir="ltr" hint={t('settings.account.emailHint')} name="email" />}
      </div>
      <div className="settings-prefs">
        <FieldSlot name="locale">
          <Segmented
            label={t('settings.account.language')}
            value={form.values.locale}
            onChange={(locale) => form.set({ locale })}
            options={LOCALES.map((l) => ({ value: l, label: t(`common.language.${l}`) }))}
          />
        </FieldSlot>
        <FieldSlot name="theme">
          <Segmented label={t('settings.account.theme')} value={form.values.theme} onChange={(theme) => form.set({ theme })} options={THEMES.map((th) => ({ value: th, label: t(`enums.theme.${th}`) }))} />
        </FieldSlot>
        <FieldSlot name="units">
          <Segmented label={t('settings.account.units')} value={form.values.units} onChange={(units) => form.set({ units })} options={UNITS.map((u) => ({ value: u, label: t(`enums.units.${u}`) }))} />
        </FieldSlot>
      </div>
      <FieldSlot name="timezone" className="stack-sm">
        <SelectField
          label={t('settings.account.timezone')}
          hint={t('settings.account.timezoneHint')}
          value={form.values.timezone}
          onChange={(e) => form.set({ timezone: e.target.value })}
          options={zones.map((z) => ({ value: z, label: z.replace(/_/g, ' ') }))}
          error={errors.timezone}
          dir="ltr"
          name="timezone"
        />
        {deviceZone !== form.values.timezone && (
          <div>
            <Button size="sm" variant="ghost" icon="globe" onClick={() => form.set({ timezone: deviceZone })}>
              {t('settings.account.useDeviceTimezone', { timezone: deviceZone })}
            </Button>
          </div>
        )}
      </FieldSlot>
    </SectionCard>
  );
}
