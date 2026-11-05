import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { TIER_LIMITS, type Tier } from '@domain/entitlements';
import { Button, Screen, Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { spacing } from '@/theme/tokens';

export interface LimitNoticeProps {
  tier: Tier;
  maxBusinesses: number;
}

/**
 * Shown instead of the first question when the account already has as many active businesses as
 * its tier allows. Explains the limit honestly — no purchase button: it links to the
 * subscription page (which states what is available) and to the business list (archive one).
 */
export function LimitNotice({ tier, maxBusinesses }: LimitNoticeProps) {
  const t = useT();
  const router = useRouter();
  const body =
    tier === 'pro'
      ? t('onboarding.limit.bodyPro', { count: maxBusinesses })
      : t('onboarding.limit.bodyFree', { count: TIER_LIMITS.free.maxBusinesses, pro: TIER_LIMITS.pro.maxBusinesses });

  return (
    <Screen testID="onboarding-limit">
      {router.canGoBack() ? (
        <View style={styles.back}>
          <Button variant="quiet" size="compact" inline icon="arrow-left" label={t('onboarding.actions.back')} onPress={() => router.back()} />
        </View>
      ) : null}
      <View style={styles.text}>
        <Text variant="display">{t('onboarding.limit.title')}</Text>
        <Text variant="callout" tone="secondary">
          {body}
        </Text>
      </View>
      <View style={styles.actions}>
        <Button variant="secondary" label={t('onboarding.limit.manage')} onPress={() => router.push('/businesses')} testID="onboarding-limit-manage" />
        <Button
          variant="quiet"
          label={t('onboarding.limit.subscription')}
          onPress={() => router.push('/settings/subscription')}
          testID="onboarding-limit-subscription"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { alignItems: 'flex-start' },
  text: { gap: spacing[3] },
  actions: { gap: spacing[2], alignItems: 'flex-start' },
});
