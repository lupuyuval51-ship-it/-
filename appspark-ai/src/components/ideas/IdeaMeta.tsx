import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Icon, type IconName } from '@/components/ui/Icon';
import type { Idea } from '@/data/types';
import { useI18n } from '@/i18n';
import { space } from '@/theme/tokens';

export function useIdeaMeta(idea: Idea) {
  const { t } = useI18n();
  const effort = t('common.weeksRange', { min: idea.effort.weeksMin, max: idea.effort.weeksMax });
  return {
    difficulty: t(`enums.difficulty.${idea.difficulty}`),
    effort,
    business: t(`enums.businessModel.${idea.businessModel}`),
    budget: t(`enums.budget.${idea.budget}`),
  };
}

interface MetaItem {
  icon: IconName;
  label: string;
}

/** Compact row of the key facts shown on cards: difficulty, effort, business model. */
export function IdeaMetaRow({ idea, compact = false }: { idea: Idea; compact?: boolean }) {
  const meta = useIdeaMeta(idea);
  const { t } = useI18n();
  const items: MetaItem[] = [
    { icon: 'activity', label: meta.difficulty },
    { icon: 'clock', label: compact ? meta.effort : t('common.mvpEffort', { range: meta.effort }) },
    { icon: 'wallet', label: meta.business },
  ];
  return (
    <View style={styles.row}>
      {items.map((item) => (
        <View key={item.icon} style={styles.item}>
          <Icon name={item.icon} size={12} color="textTertiary" />
          <AppText variant="caption" color="textSecondary" numberOfLines={1}>
            {item.label}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.md,
    rowGap: space.xs,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
});
