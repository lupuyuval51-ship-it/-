/**
 * Route /launch: Launch Center. Business country (changed on /businesses/<id>), a calm but
 * prominent disclaimer, recommended items from verified official sources (seeded idempotently),
 * the checklist grouped by category with status toggles and progress, and custom items.
 */
import * as WebBrowser from 'expo-web-browser';
import { Stack, useRouter, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button, EmptyState, ErrorState, InlineNotice, LoadingState, ProgressBar, Screen, Section, Text, useNotice } from '@/components/ui';
import { useActiveBusiness } from '@/features/business/api';
import { COUNTRY_BY_CODE } from '@/features/onboarding/countries';
import { useLocale, useT, type TFunction } from '@/i18n/I18nProvider';
import { formatDate } from '@/i18n/format';
import type { Locale } from '@/i18n/types';
import { toAppError } from '@/lib/errors';
import { useIsOnline } from '@/lib/net';
import { spacing } from '@/theme/tokens';
import { useLaunchItems, useSeedLaunchTemplates, useSetLaunchStatus } from '../api';
import { LaunchItemRow } from '../components/LaunchItemRow';
import { computeLaunchProgress, groupLaunchItems, missingTemplates, type LaunchItem } from '../logic';
import { GENERIC_RESEARCH_CATEGORIES, LAUNCH_TEMPLATES_LAST_REVIEWED, isTemplateCountry } from '../templates';

function countryName(code: string | null, locale: Locale): string | null {
  if (!code) return null;
  const country = COUNTRY_BY_CODE.get(code.toUpperCase());
  return country ? country[locale] : code.toUpperCase();
}

export default function LaunchScreen() {
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const notice = useNotice();
  const online = useIsOnline();
  const { business, businessId, isLoading: businessLoading } = useActiveBusiness();
  const items = useLaunchItems(businessId);
  const seed = useSeedLaunchTemplates(businessId);
  const status = useSetLaunchStatus(businessId);

  const header = <Stack.Screen options={{ title: t('launch.title') }} />;

  if ((!business && businessLoading) || (items.isLoading && !items.data)) {
    return (
      <Screen edges={['bottom']}>
        {header}
        <LoadingState variant="screen" />
      </Screen>
    );
  }

  if (!business || !businessId) {
    return (
      <Screen edges={['bottom']}>
        {header}
        <EmptyState title={t('launch.title')} body={t('launch.noBusiness')} />
      </Screen>
    );
  }

  if (items.error && !items.data) {
    return (
      <Screen edges={['bottom']}>
        {header}
        <ErrorState error={items.error} onRetry={() => void items.refetch()} retrying={items.isRefetching} />
      </Screen>
    );
  }

  const list = items.data ?? [];
  const code = business.country_code;
  const name = countryName(code, locale);
  const hasTemplates = isTemplateCountry(code);
  const missing = missingTemplates(list, code);
  const progress = computeLaunchProgress(list);
  const groups = groupLaunchItems(list);

  const openBusiness = () => router.push(`/businesses/${encodeURIComponent(businessId)}` as Href);
  const addCustom = () => router.push('/launch/item/new' as Href);
  const openItem = (item: LaunchItem) => router.push(`/launch/item/${encodeURIComponent(item.id)}` as Href);
  const openSource = (url: string) => {
    WebBrowser.openBrowserAsync(url).catch(() => notice.show({ tone: 'error', message: t('launch.openSourceFailed') }));
  };
  const toggle = (item: LaunchItem) => {
    if (!online) return;
    const next = item.status === 'todo' ? 'done' : 'todo';
    status.setStatus(item.id, next).catch(() => undefined);
  };
  const runSeed = () => {
    if (!online || !code || seed.isPending) return;
    seed.mutate(code, {
      onSuccess: ({ added }) => notice.show({ tone: added > 0 ? 'success' : 'info', message: t('launch.seed.added', { count: added }) }),
    });
  };

  return (
    <Screen edges={['bottom']} refreshing={items.isRefetching} onRefresh={() => void items.refetch()} testID="launch-screen">
      {header}

      <View style={styles.countryRow}>
        <View style={styles.flex}>
          <Text variant="overline" tone="secondary">
            {t('launch.header.country')}
          </Text>
          <Text variant="heading" testID="launch-country">
            {name ?? t('launch.header.noCountry')}
          </Text>
        </View>
        <Button label={t('launch.header.change')} variant="quiet" size="compact" onPress={openBusiness} accessibilityHint={t('launch.header.changeA11y')} testID="launch-change-country" />
      </View>

      <InlineNotice tone="info" title={t('launch.disclaimer.title')} message={t('launch.disclaimer.body')} testID="launch-disclaimer" />

      {!online ? <InlineNotice tone="warning" message={t('launch.offline')} /> : null}
      {seed.error ? <InlineNotice tone="error" message={t(toAppError(seed.error).messageKey)} /> : null}
      {status.error ? <InlineNotice tone="error" message={t(toAppError(status.error).messageKey)} onDismiss={() => status.reset()} /> : null}

      {hasTemplates && missing.length > 0 ? (
        <View style={styles.seed}>
          {list.length > 0 ? (
            <Text variant="callout" tone="secondary">
              {t('launch.seed.more', { count: missing.length })}
            </Text>
          ) : null}
          <Button
            label={t('launch.seed.action', { country: name ?? '' })}
            variant={list.length === 0 ? 'primary' : 'secondary'}
            onPress={runSeed}
            loading={seed.isPending}
            disabled={!online}
            fullWidth
            testID="launch-seed"
          />
          <Text variant="caption" tone="secondary">
            {t('launch.seed.reviewed', { date: formatDate(LAUNCH_TEMPLATES_LAST_REVIEWED, locale) })}
          </Text>
        </View>
      ) : null}

      {!hasTemplates ? <GenericTopics t={t} countryLabel={name} onChooseCountry={openBusiness} /> : null}

      {list.length === 0 ? (
        hasTemplates ? (
          <View style={styles.emptyNote}>
            <Text variant="heading">{t('launch.empty.title')}</Text>
            <Text variant="body" tone="secondary">
              {t('launch.empty.body')}
            </Text>
          </View>
        ) : null
      ) : (
        <View style={styles.progress}>
          <Text variant="bodyStrong" numeric accessibilityLabel={t('launch.progressA11y', { done: progress.done, total: progress.applicable })} testID="launch-progress">
            {t('launch.progress', { done: progress.done, total: progress.applicable })}
          </Text>
          <ProgressBar value={progress.ratio} accessibilityLabel={t('launch.progressA11y', { done: progress.done, total: progress.applicable })} />
          {progress.notApplicable > 0 ? (
            <Text variant="caption" tone="secondary">
              {t('launch.progressNotApplicable', { count: progress.notApplicable })}
            </Text>
          ) : null}
        </View>
      )}

      {groups.map((group) => (
        <Section key={group.category} title={t(`launch.categories.${group.category}`)} separated testID={`launch-group-${group.category}`}>
          {group.items.map((item) => (
            <LaunchItemRow
              key={item.id}
              item={item}
              onToggle={() => toggle(item)}
              onOpen={() => openItem(item)}
              onOpenSource={openSource}
              disabled={!online}
            />
          ))}
        </Section>
      ))}

      <Button label={t('launch.addCustom')} variant="quiet" icon="plus" inline onPress={addCustom} disabled={!online} testID="launch-add-custom" />
    </Screen>
  );
}

function GenericTopics({ t, countryLabel, onChooseCountry }: { t: TFunction; countryLabel: string | null; onChooseCountry: () => void }) {
  return (
    <View style={styles.generic} testID="launch-generic">
      <Section title={t('launch.generic.title')} description={countryLabel ? t('launch.generic.note', { country: countryLabel }) : t('launch.generic.noCountryNote')} separated>
        {GENERIC_RESEARCH_CATEGORIES.map((category) => (
          <View key={category} style={styles.topic} accessible accessibilityLabel={`${t(`launch.categories.${category}`)}. ${t(`launch.generic.${category}`)}`}>
            <Text variant="bodyStrong">{t(`launch.categories.${category}`)}</Text>
            <Text variant="callout" tone="secondary">
              {t(`launch.generic.${category}`)}
            </Text>
          </View>
        ))}
      </Section>
      {countryLabel ? null : <Button label={t('launch.generic.setCountry')} variant="primary" onPress={onChooseCountry} testID="launch-set-country" />}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  countryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  seed: { gap: spacing[2] },
  emptyNote: { gap: spacing[2] },
  progress: { gap: spacing[2] },
  topic: { gap: 2, paddingVertical: spacing[3] },
  generic: { gap: spacing[4] },
});
