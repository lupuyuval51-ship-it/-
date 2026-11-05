import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { OnboardingAnswers, OnboardingKey } from '@domain/onboarding';
import { Divider, Icon, Text } from '@/components/ui';
import { useLocale, useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { summarizeAnswers } from '../logic';
import { StepLayout } from './StepLayout';

export interface ReviewStepProps {
  answers: OnboardingAnswers;
  onEdit: (key: OnboardingKey) => void;
  onCreate: () => void;
  creating: boolean;
  onBack: () => void;
  error: string | null;
  offline: boolean;
}

/** Every answer on one page — tap a row to edit it — and the one primary action. */
export function ReviewStep({ answers, onEdit, onCreate, creating, onBack, error, offline }: ReviewStepProps) {
  const t = useT();
  const { locale } = useLocale();
  const { colors } = useTheme();
  const items = useMemo(() => summarizeAnswers(answers, { t, locale }), [answers, t, locale]);

  return (
    <StepLayout
      step="review"
      title={t('onboarding.review.title')}
      why={t('onboarding.review.body')}
      primaryLabel={t('onboarding.actions.create')}
      onPrimary={onCreate}
      primaryLoading={creating}
      onBack={onBack}
      actionsDisabled={offline}
      error={error}
      notice={offline ? t('onboarding.errors.offline') : null}
      noticeTone="warning"
      testID="onboarding-step-review"
    >
      <View>
        {items.map((item, index) => {
          const label = t(`onboarding.${item.key}.label`);
          const value =
            item.status === 'answered'
              ? (item.primary ?? '')
              : item.status === 'skipped'
                ? t('onboarding.review.skipped')
                : t('onboarding.review.unanswered');
          return (
            <View key={item.key}>
              {index > 0 ? <Divider /> : null}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${label}: ${value}`}
                accessibilityHint={t('onboarding.a11y.editAnswer', { question: label })}
                onPress={() => onEdit(item.key)}
                disabled={creating}
                testID={`onboarding-review-${item.key}`}
                style={({ pressed }) => [styles.row, pressed ? { backgroundColor: colors.backgroundAlt } : null]}
              >
                <View style={styles.rowText}>
                  <Text variant="caption" tone="secondary">
                    {label}
                  </Text>
                  <Text variant="body" tone={item.status === 'answered' ? 'default' : 'secondary'}>
                    {value}
                  </Text>
                  {item.secondary ? (
                    <Text variant="caption" tone="secondary">
                      {item.secondary}
                    </Text>
                  ) : null}
                </View>
                <Icon name="chevron-right" size={18} tone="secondary" />
              </Pressable>
            </View>
          );
        })}
      </View>
      <Text variant="caption" tone="secondary">
        {t('onboarding.review.note')}
      </Text>
    </StepLayout>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingVertical: spacing[3] },
  rowText: { flex: 1, gap: 2 },
});
