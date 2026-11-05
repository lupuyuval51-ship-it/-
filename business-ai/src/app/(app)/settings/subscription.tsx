/**
 * /settings/subscription — an honest plans screen: the current tier, Free vs Pro limits from
 * TIER_LIMITS, this month's AI usage, and a plain statement that purchases are not available.
 */
import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AI_FEATURES, TIER_LIMITS, type AiFeature, type Tier } from '@domain/entitlements';
import { ErrorState, InlineNotice, LoadingState, ProgressBar, Screen, Section, Text } from '@/components/ui';
import { useAiUsage, useEntitlement } from '@/features/settings/api';
import { useLocale, useT } from '@/i18n/I18nProvider';
import { formatDate, formatNumber } from '@/i18n/format';
import { spacing } from '@/theme/tokens';

const COLUMNS: readonly Tier[] = ['free', 'pro'];

export default function SubscriptionScreen() {
  const t = useT();
  const { locale } = useLocale();
  const entitlement = useEntitlement();
  const usage = useAiUsage();
  const tier = entitlement.tier;
  const limits = entitlement.limits;
  const raw = entitlement.entitlement;
  const inactive = raw !== null && raw.tier === 'pro' && tier === 'free';
  const n = (value: number) => formatNumber(value, locale);
  const tierLabel = (x: Tier) => t(`settings.subscription.tier.${x}`);
  const featureLabel = (f: AiFeature) => t(`settings.usage.features.${f}`);

  return (
    <>
      <Stack.Screen options={{ title: t('settings.subscriptionScreen.title') }} />
      <Screen
        edges={['bottom']}
        refreshing={usage.isRefetching}
        onRefresh={() => {
          entitlement.refetch();
          void usage.refetch();
        }}
        gap={spacing[10]}
      >
        <Section title={t('settings.subscription.current')} titleVariant="overline">
          {entitlement.isLoading ? (
            <LoadingState variant="text" count={1} />
          ) : entitlement.error ? (
            <ErrorState error={entitlement.error} onRetry={entitlement.refetch} />
          ) : (
            <View style={styles.current}>
              <Text variant="title">{tierLabel(tier)}</Text>
              {tier === 'pro' && raw?.current_period_end ? (
                <Text variant="callout" tone="secondary">
                  {t('settings.subscription.validUntil', { date: formatDate(raw.current_period_end, locale) })}
                </Text>
              ) : null}
              {inactive ? (
                <Text variant="callout" tone="secondary">
                  {t('settings.subscriptionScreen.inactive')}
                </Text>
              ) : null}
            </View>
          )}
        </Section>

        <InlineNotice tone="info" title={t('settings.subscriptionScreen.unavailableTitle')} message={t('settings.subscriptionScreen.unavailableBody')} />

        <Section title={t('settings.subscriptionScreen.compareHeading')}>
          <View>
            <View style={styles.row} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <View style={styles.label} />
              {COLUMNS.map((c) => (
                <Text key={c} variant="caption" weight={600} tone={!entitlement.isLoading && c === tier ? 'accent' : 'secondary'} align="end" style={styles.cell}>
                  {tierLabel(c)}
                </Text>
              ))}
            </View>
            <CompareRow
              label={t('settings.subscription.businessesLabel')}
              free={t('settings.subscription.businesses', { count: TIER_LIMITS.free.maxBusinesses })}
              pro={t('settings.subscription.businesses', { count: TIER_LIMITS.pro.maxBusinesses })}
            />
            <CompareRow
              label={t('settings.subscription.forecastLabel')}
              free={t('settings.subscription.forecast', { count: TIER_LIMITS.free.maxForecastMonths })}
              pro={t('settings.subscription.forecast', { count: TIER_LIMITS.pro.maxForecastMonths })}
            />
          </View>

          <Text variant="overline" tone="secondary" style={styles.subheading}>
            {t('settings.subscriptionScreen.aiHeading')}
          </Text>
          <View>
            {AI_FEATURES.map((f) => (
              <CompareRow key={f} label={featureLabel(f)} free={n(TIER_LIMITS.free.monthlyAiCalls[f])} pro={n(TIER_LIMITS.pro.monthlyAiCalls[f])} />
            ))}
          </View>
          <Text variant="caption" tone="secondary">
            {t('settings.subscriptionScreen.costCapNote')}
          </Text>
        </Section>

        <Section title={t('settings.sections.usage')} description={t('settings.usage.resets')}>
          {usage.isLoading || entitlement.isLoading ? (
            <LoadingState variant="list" count={4} />
          ) : usage.error && !usage.data ? (
            <ErrorState error={usage.error} onRetry={() => void usage.refetch()} />
          ) : (
            <View style={styles.usage}>
              {AI_FEATURES.map((f) => {
                const used = usage.data?.[f] ?? 0;
                const limit = limits.monthlyAiCalls[f];
                const ratio = limit > 0 ? used / limit : 1;
                return (
                  <View
                    key={f}
                    style={styles.usageItem}
                    accessible
                    accessibilityLabel={t('settings.subscriptionScreen.usageA11y', { feature: featureLabel(f), used, limit })}
                  >
                    <View style={styles.usageRow}>
                      <Text variant="callout" style={styles.flex}>
                        {featureLabel(f)}
                      </Text>
                      <Text variant="caption" tone="secondary" numeric>
                        {t('settings.usage.of', { used, limit })}
                      </Text>
                    </View>
                    <ProgressBar value={ratio} height={2} tone={ratio >= 1 ? 'danger' : ratio >= 0.8 ? 'warning' : 'accent'} />
                  </View>
                );
              })}
            </View>
          )}
        </Section>
      </Screen>
    </>
  );
}

function CompareRow({ label, free, pro }: { label: string; free: string; pro: string }) {
  const t = useT();
  return (
    <View style={styles.row} accessible accessibilityLabel={t('settings.subscriptionScreen.compareA11y', { label, free, pro })}>
      <Text variant="callout" style={styles.label}>
        {label}
      </Text>
      <Text variant="callout" tone="secondary" numeric align="end" style={styles.cell}>
        {free}
      </Text>
      <Text variant="callout" tone="secondary" numeric align="end" style={styles.cell}>
        {pro}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  current: { gap: spacing[2] },
  row: { flexDirection: 'row', alignItems: 'baseline', gap: spacing[3], paddingVertical: spacing[2] },
  label: { flex: 1 },
  cell: { width: 88 },
  subheading: { paddingTop: spacing[4] },
  usage: { gap: spacing[4] },
  usageItem: { gap: spacing[2] },
  usageRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing[3] },
});
