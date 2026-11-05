import { zodResolver } from '@hookform/resolvers/zod';
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Platform, StyleSheet, View } from 'react-native';
import { z } from 'zod';
import { AI_FEATURES } from '@domain/entitlements';
import {
  Button,
  ErrorState,
  ListRow,
  LoadingState,
  ProgressBar,
  Screen,
  Section,
  SegmentedControl,
  Text,
  TextField,
  useConfirm,
  useNotice,
} from '@/components/ui';
import { useAuth } from '@/features/auth/AuthProvider';
import { displayNameSchema } from '@/features/auth/schemas';
import { directionChangeRequiresReload } from '@/i18n/direction';
import { formatDate, formatNumber } from '@/i18n/format';
import { useLocale, useT } from '@/i18n/I18nProvider';
import type { Locale } from '@/i18n/types';
import { toAppError } from '@/lib/errors';
import { useFieldError } from '@/lib/forms';
import { useTheme, type ThemePreference } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { useAiUsage, useEntitlement, useProfile, useUpdateProfile } from '../api';

const nameFormSchema = z.object({ displayName: displayNameSchema });
type NameFormValues = z.infer<typeof nameFormSchema>;

function AccountSection() {
  const t = useT();
  const notice = useNotice();
  const fieldError = useFieldError();
  const { user } = useAuth();
  const profile = useProfile();
  const updateProfile = useUpdateProfile();
  const [saveError, setSaveError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<NameFormValues>({ resolver: zodResolver(nameFormSchema), defaultValues: { displayName: '' } });

  const savedName = profile.data?.display_name ?? '';
  useEffect(() => {
    reset({ displayName: savedName });
  }, [savedName, reset]);

  const onSave = handleSubmit(async ({ displayName }) => {
    setSaveError(null);
    try {
      await updateProfile.mutateAsync({ display_name: displayName.trim() });
      notice.show({ message: t('settings.account.saved') });
    } catch (e) {
      setSaveError(t(toAppError(e).messageKey));
    }
  });

  return (
    <Section title={t('settings.sections.account')} titleVariant="overline">
      {profile.isLoading ? (
        <LoadingState variant="text" count={2} />
      ) : profile.error && !profile.data ? (
        <ErrorState error={profile.error} onRetry={() => void profile.refetch()} retrying={profile.isFetching} />
      ) : (
        <View style={styles.nameForm}>
          <Controller
            control={control}
            name="displayName"
            render={({ field }) => (
              <TextField
                label={t('settings.account.displayName')}
                hint={t('settings.account.displayNameHint')}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
                error={fieldError(errors.displayName) ?? saveError ?? undefined}
                autoComplete="name"
                autoCapitalize="words"
                maxLength={100}
                returnKeyType="done"
                onSubmitEditing={() => void onSave()}
                testID="display-name-input"
              />
            )}
          />
          {isDirty ? (
            <Button
              variant="secondary"
              size="compact"
              label={t('settings.account.save')}
              onPress={() => void onSave()}
              loading={isSubmitting}
              testID="save-display-name"
            />
          ) : null}
        </View>
      )}
      <ListRow title={t('settings.account.email')} value={user?.email ?? ''} testID="account-email" />
    </Section>
  );
}

function LanguageSection() {
  const t = useT();
  const confirm = useConfirm();
  const notice = useNotice();
  const { locale, setLocale } = useLocale();
  const updateProfile = useUpdateProfile();

  const change = async (next: Locale) => {
    if (next === locale) return;
    const reload = directionChangeRequiresReload(next);
    if (reload) {
      const ok = await confirm({
        title: t('settings.language.confirmTitle'),
        message: t('settings.language.confirmBody', { language: t(`common.language.${next}`) }),
        confirmLabel: t('settings.language.confirm'),
      });
      if (!ok) return;
    }
    try {
      await updateProfile.mutateAsync({ locale: next });
    } catch {
      // Saved locally as pending; PreferencesSync retries when back online.
    }
    await setLocale(next);
    if (!reload) notice.show({ message: t('settings.language.saved') });
  };

  return (
    <Section title={t('settings.sections.language')} titleVariant="overline">
      <SegmentedControl<Locale>
        accessibilityLabel={t('settings.sections.language')}
        value={locale}
        onChange={(next) => void change(next)}
        options={[
          { value: 'he', label: t('common.language.he') },
          { value: 'en', label: t('common.language.en') },
        ]}
        testID="settings-language"
      />
      {Platform.OS !== 'web' ? (
        <Text variant="caption" tone="secondary">
          {t('settings.language.restartHint')}
        </Text>
      ) : null}
    </Section>
  );
}

function AppearanceSection() {
  const t = useT();
  const { preference, setPreference } = useTheme();
  return (
    <Section title={t('settings.sections.appearance')} titleVariant="overline">
      <SegmentedControl<ThemePreference>
        accessibilityLabel={t('settings.appearance.label')}
        value={preference}
        onChange={(next) => setPreference(next)}
        options={[
          { value: 'system', label: t('common.theme.system') },
          { value: 'light', label: t('common.theme.light') },
          { value: 'dark', label: t('common.theme.dark') },
        ]}
        testID="settings-theme"
      />
    </Section>
  );
}

function SubscriptionSection() {
  const t = useT();
  const { locale } = useLocale();
  const entitlement = useEntitlement();
  const usage = useAiUsage();
  const { tier, limits } = entitlement;

  return (
    <>
      <Section title={t('settings.sections.subscription')} titleVariant="overline" separated>
        {entitlement.isLoading ? (
          <LoadingState variant="list" count={2} />
        ) : entitlement.error && !entitlement.entitlement ? (
          <ErrorState error={entitlement.error} onRetry={entitlement.refetch} />
        ) : (
          [
            <ListRow
              key="tier"
              title={t('settings.subscription.current')}
              value={t(`settings.subscription.tier.${tier}`)}
              subtitle={
                tier === 'pro' && entitlement.entitlement?.current_period_end
                  ? t('settings.subscription.validUntil', { date: formatDate(entitlement.entitlement.current_period_end, locale) })
                  : undefined
              }
              testID="subscription-tier"
            />,
            <ListRow
              key="businesses"
              title={t('settings.subscription.businessesLabel')}
              value={t('settings.subscription.businesses', { count: limits.maxBusinesses })}
            />,
            <ListRow
              key="forecast"
              title={t('settings.subscription.forecastLabel')}
              value={t('settings.subscription.forecast', { count: limits.maxForecastMonths })}
            />,
          ]
        )}
      </Section>
      {!entitlement.isLoading ? (
        <Text variant="caption" tone="secondary" style={styles.upgradeNote}>
          {t('settings.subscription.upgradeUnavailable')}
        </Text>
      ) : null}

      <Section title={t('settings.sections.usage')} titleVariant="overline" description={t('settings.usage.resets')}>
        {usage.isLoading || entitlement.isLoading ? (
          <LoadingState variant="list" count={4} />
        ) : usage.error && !usage.data ? (
          <ErrorState error={usage.error} onRetry={() => void usage.refetch()} retrying={usage.isFetching} />
        ) : usage.data ? (
          <View style={styles.usageList} testID="ai-usage">
            {AI_FEATURES.map((feature) => {
              const used = usage.data[feature];
              const limit = limits.monthlyAiCalls[feature];
              const ratio = limit > 0 ? used / limit : 1;
              const label = t(`settings.usage.features.${feature}`);
              return (
                <View key={feature} style={styles.usageRow}>
                  <View style={styles.usageText}>
                    <Text variant="callout" style={styles.usageLabel}>
                      {label}
                    </Text>
                    <Text variant="caption" tone={ratio >= 1 ? 'danger' : 'secondary'} numeric>
                      {t('settings.usage.of', { used: formatNumber(used, locale), limit: formatNumber(limit, locale) })}
                    </Text>
                  </View>
                  <ProgressBar value={ratio} tone={ratio >= 1 ? 'danger' : ratio >= 0.8 ? 'warning' : 'accent'} accessibilityLabel={label} />
                </View>
              );
            })}
          </View>
        ) : null}
      </Section>
    </>
  );
}

function SessionSection() {
  const t = useT();
  const confirm = useConfirm();
  const notice = useNotice();
  const { signOut } = useAuth();
  const [busy, setBusy] = useState(false);

  const onSignOut = async () => {
    const ok = await confirm({
      title: t('settings.signOut.confirmTitle'),
      message: t('settings.signOut.confirmBody'),
      confirmLabel: t('settings.signOut.confirm'),
      destructive: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      await signOut();
    } catch (e) {
      notice.show({ tone: 'error', message: t(toAppError(e).messageKey) });
      setBusy(false);
    }
  };

  return (
    <Section title={t('settings.sections.session')} titleVariant="overline">
      <Button variant="destructive" icon="log-out" label={t('settings.signOut.button')} onPress={() => void onSignOut()} loading={busy} testID="sign-out" />
    </Section>
  );
}

export function SettingsView() {
  const t = useT();
  const profile = useProfile();
  const entitlement = useEntitlement();
  const usage = useAiUsage();
  const version = Constants.expoConfig?.version;
  const refreshing = profile.isRefetching || usage.isRefetching;

  return (
    <Screen
      edges={['bottom']}
      gap={spacing[10]}
      refreshing={refreshing}
      onRefresh={() => {
        void profile.refetch();
        void usage.refetch();
        entitlement.refetch();
      }}
      testID="settings-screen"
    >
      <AccountSection />
      <LanguageSection />
      <AppearanceSection />
      <SubscriptionSection />
      <SessionSection />
      {version ? (
        <Text variant="caption" tone="secondary" align="center">
          {t('settings.about.version', { version })}
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  nameForm: { gap: spacing[3] },
  upgradeNote: { marginTop: -spacing[8] },
  usageList: { gap: spacing[5] },
  usageRow: { gap: spacing[2] },
  usageText: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing[3] },
  usageLabel: { flex: 1 },
});
