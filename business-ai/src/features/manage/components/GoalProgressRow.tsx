import { Pressable, StyleSheet, View } from 'react-native';
import { Icon, ProgressBar, Text } from '@/components/ui';
import { useLocale, useT } from '@/i18n/I18nProvider';
import { formatDate, formatMoney, formatNumber, formatPercent } from '@/i18n/format';
import type { Locale } from '@/i18n/types';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import type { GoalRow } from '../api';
import { goalProgress, type GoalProgress, type TransactionLike } from '../logic';

export function formatGoalValue(value: number, goal: Pick<GoalRow, 'metric' | 'unit'>, currency: string, locale: Locale): string {
  if (goal.metric === 'revenue' || goal.metric === 'profit') return formatMoney(value, currency, locale);
  const number = formatNumber(value, locale, { maximumFractionDigits: 2 });
  return goal.unit ? `${number} ${goal.unit}` : number;
}

export interface GoalProgressRowProps {
  goal: GoalRow;
  transactions: readonly TransactionLike[];
  currency: string;
  onPress: () => void;
  testID?: string;
}

/** Goal title, "x of y", a thin progress line and the due date. */
export function GoalProgressRow({ goal, transactions, currency, onPress, testID }: GoalProgressRowProps) {
  const t = useT();
  const { locale } = useLocale();
  const { colors } = useTheme();
  const progress: GoalProgress = goalProgress(goal, transactions);
  const current = formatGoalValue(progress.current, goal, currency, locale);
  const target = formatGoalValue(progress.target, goal, currency, locale);
  const percent = formatPercent(progress.percent, locale, { fractionDigits: 0 });
  const meta = [
    goal.status === 'active' && progress.reached ? t('manage.goals.reached') : null,
    goal.due_date ? t('manage.goals.due', { date: formatDate(goal.due_date, locale, { style: 'medium' }) }) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('manage.goals.progressA11y', { title: goal.title, current, target, percent })}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [styles.row, { backgroundColor: pressed ? colors.backgroundAlt : 'transparent' }]}
    >
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text variant="body" style={styles.flex}>
            {goal.title}
          </Text>
          <Text variant="caption" tone="secondary" numeric>
            {t('manage.goals.progress', { current, target })}
          </Text>
        </View>
        <ProgressBar value={progress.ratio} height={2} accessibilityLabel={goal.title} />
        {meta ? (
          <Text variant="caption" tone="secondary">
            {meta}
          </Text>
        ) : null}
      </View>
      <Icon name="chevron-right" size={18} tone="secondary" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingVertical: spacing[3] },
  body: { flex: 1, gap: spacing[2] },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing[3] },
  flex: { flex: 1 },
});
